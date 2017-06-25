using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolServer
{
    public class OnPoolServer
    {
        private readonly List<Client> clients = new List<Client>();
        private readonly List<Pool> pools = new List<Pool>();
        private readonly ClientListener serverManager;

        private readonly Dictionary<string, Action<Query>> messageResponses = new Dictionary<string, Action<Query>>();
        private readonly Dictionary<string, int> poolAllCounter = new Dictionary<string, int>();

        public OnPoolServer()
        {
            var threadManager = LocalThreadManager.Start();
            serverManager = new ClientListener(socket => {
                var socketManager = new SocketManager(socket);
                socketManager.onReceive += onMessage;
                socketManager.OnDisconnect += RemoveClient;
                AddClient(socketManager);
                socketManager.Start();
            }
            );
            serverManager.StartServer();
            threadManager.Process();
        }

        private void onMessage(SocketManager socketManager, Query message)
        {
            Client fromClient = GetClient(socketManager.Id);


            switch (message.Direction) {
                case QueryDirection.Request:

                    var receiptId = message.RequestKey;
                    ClientMessage(fromClient, message, queryResponse => {
                        var q = new Query();
                        q.Method = message.Method;
                        q.Direction = QueryDirection.Response;
                        q.Type = message.Type;
                        q.ResponseOptions = message.ResponseOptions;
                        q.To = fromClient.Id;
                        q.RequestKey = receiptId;
                        if (message.Contains("~PoolAllCount~")) {
                            q.Add("~PoolAllCount~", message.Get("~PoolAllCount~"));
                        }
                        q.AddJson(queryResponse);
                        socketManager.SendMessage(q);
                    }
                    );

                    break;
                case QueryDirection.Response:
                    var requestId = socketManager.Id + message.RequestKey;

                    if (messageResponses.ContainsKey(requestId)) {
                        var callback = messageResponses[requestId];
                        if (message.ResponseOptions == ResponseOptions.SingleResponse) {
                            if (message.Contains("~PoolAllCount~")) {
                                if (!poolAllCounter.ContainsKey(requestId))
                                    poolAllCounter[requestId] = 1;
                                else
                                    poolAllCounter[requestId] = poolAllCounter[requestId] + 1;

                                if (poolAllCounter[requestId] == int.Parse(message.Get("~PoolAllCount~"))) {
                                    messageResponses.Remove(requestId);
                                    poolAllCounter.Remove(requestId);
                                }
                            }
                            else {
                                messageResponses.Remove(requestId);
                            }
                        }
                        callback?.Invoke(message);
                    }
                    else {
                        Console.WriteLine(string.Join(",", messageResponses.Keys.ToArray()));
                        throw new Exception("Cannot find response callback  " + message);
                    }

                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }


        }

        private void ClientMessage(Client client, Query query, Action<object> respond)
        {
            switch (query.Type) {
                case QueryType.Client:
                    ForwardMessageToClient(query, respond);
                    break;
                case QueryType.Pool:
                    ForwardMessageToPool(query, respond);
                    break;
                case QueryType.PoolAll:
                    ForwardMessageToPoolAll(query, respond);
                    break;
                case QueryType.Server:
                    switch (query.Method) {
                        case "GetClientId": {
                                respond(client.Id);
                                break;
                            }
                        case "GetAllPools": { 
                                respond(new GetAllPoolsResponse {
                                    PoolNames = pools.Select(a => a.Name).ToArray()
                                });
                                break;
                            }
                        case "OnPoolUpdated": {
                                var pool = getPoolByName(query.Get("PoolName"));
                                pool.OnClientChange(client, () => {
                                    respond(GetClientByPool(query.Get("PoolName")));
                                });
                                respond(GetClientByPool(query.Get("PoolName")));

                                break;
                            }
                        case "JoinPool": {
                                JoinPool(client, query.Get("PoolName"));
                                respond(null);
                                break;
                            }
                        case "LeavePool": {
                                var pool = getPoolByName(query.Get("PoolName"));
                                if (pool.ContainsClient(client)) {
                                    pool.RemoveClient(client);
                                    if (pool.IsEmpty()) {
                                        pools.Remove(pool);
                                    }
                                }
                                respond(null);
                                break;
                            }
                        case "GetClients": {
                                respond(GetClientByPool(query.Get("PoolName")));
                                break;
                            }
                        default: throw new Exception("Method not found: " + query.Method);
                    }
                    break;
                default:
                    throw new Exception("Type not found " + query);
            }


        }

        private GetClientByPoolResponse GetClientByPool(string poolName)
        {
            return new GetClientByPoolResponse {
                Clients = getPoolByName(poolName).GetClientsResponse()
            };
        }

        public Client GetClient(string id)
        {
            return clients.FirstOrDefault(a => a.Id == id);
        }

        public void AddClient(SocketManager socketManager)
        {
            var client = new Client(socketManager, socketManager.Id);
            clients.Add(client);
            JoinPool(client, "Everyone");
        }

        public void RemoveClient(SocketManager socketManager)
        {
            var client = clients.First(a => a.Id == socketManager.Id);
            clients.Remove(client);
            foreach (var key in messageResponses.Keys.ToArray()) {
                if (key.StartsWith(client.Id)) {
                    messageResponses.Remove(key);
                }
            }
            foreach (var key in poolAllCounter.Keys.ToArray()) {
                if (key.StartsWith(client.Id)) {
                    poolAllCounter.Remove(key);
                }
            }

            for (var index = pools.Count - 1; index >= 0; index--) {
                var serverPool = pools[index];
                if (serverPool.ContainsClient(client)) {
                    serverPool.RemoveClient(client);
                    if (serverPool.IsEmpty()) {
                        pools.Remove(serverPool);
                    }
                }
            }
        }
         
        public void JoinPool(Client client, string poolName)
        {
            var pool = getPoolByName(poolName);
            if (pool.ContainsClient(client)) {
                return;
            }
            pool.AddClient(client);

        }
         
        public bool FowardMessage(SocketManager socketManager, Query message, Action<Query> callback)
        {
            if (socketManager == null) {
                throw new Exception("socket not found " + message);
            }

            var responseKey = message.RequestKey;
            messageResponses[socketManager.Id + responseKey] = callback;

            if (message.From == null)
                message.From = socketManager.Id;

            return socketManager.SendMessage(message);
        }

        public void ForwardMessageToClient(Query query, Action<object> respond)
        {
            var client = clients.FirstOrDefault(a => a.Id == query.To);
            FowardMessage(client?.SocketManager, query, (q) => {
                respond(q.GetJson<object>());
            });
        }

        public void ForwardMessageToPool(Query query, Action<object> respond)
        {
            var poolName = query.To;
            var pool = getPoolByName(poolName);
            var client = pool.GetRoundRobin();
            if (client == null) {
                Console.WriteLine("No round robin found " + query);
                //todo idk, maybe tell the caller theres no round robin
                return;
            }
            FowardMessage(client.SocketManager, query, (q) => {
                respond(q.GetJson<object>());
            });
        }

        public void ForwardMessageToPoolAll(Query query, Action<object> respond)
        {
            var poolName = query.To;
            var pool = getPoolByName(poolName);
            var count = pool.NumberOfClients;

            query.Add("~PoolAllCount~", count.ToString());

            foreach (var socket in pool.GetClientsSockets()) {
                FowardMessage(socket, query, (q) => {
                    respond(q.GetJson<object>());
                });
            }
        }

        public bool SendMessage(SocketManager socketManager, Query message, Action<Query> callback)
        {
            messageResponses[socketManager.Id + message.RequestKey] = callback;

            if (message.From == null)
                message.From = socketManager.Id;
            return socketManager.SendMessage(message);
        }

        public void Disconnect()
        {
            serverManager.Disconnect();
        }

        private Pool getPoolByName(string poolName)
        {
            var pool = pools.FirstOrDefault(a => a.Name == poolName);

            if (pool == null)
                pools.Add(pool = new Pool(poolName));
            return pool;
        }
    }
}