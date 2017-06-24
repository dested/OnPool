using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolServer
{
    public class OnPoolServer
    {
        private readonly List<Pool> pools = new List<Pool>();
        private readonly ClientListener serverManager;
        public readonly List<Client> Clients = new List<Client>();


        private readonly Dictionary<string, Action<Query>> messageResponses = new Dictionary<string, Action<Query>>();
        private readonly Dictionary<string, int> poolAllCounter = new Dictionary<string, int>();

        public OnPoolServer()
        {
            var threadManager = LocalThreadManager.Start();
            serverManager = new ClientListener(socket =>
                {
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


            switch (message.Direction)
            {
                case QueryDirection.Request:

                    var receiptId = message.RequestKey;
                    ClientMessage(fromClient, message, queryResponse =>
                        {
                            var q = Query.Build(queryResponse.Method, QueryDirection.Response, queryResponse.Type);
                            q.ResponseOptions = message.ResponseOptions;
                            q.Add(queryResponse);
                            q.RequestKey = receiptId;
                            socketManager.SendMessage(q);
                        }
                    );

                    break;
                case QueryDirection.Response:
                    var requestId = socketManager.Id + message.RequestKey;

                    if (messageResponses.ContainsKey(requestId))
                    {
                        var callback = messageResponses[requestId];
                        if (message.ResponseOptions == ResponseOptions.SingleResponse)
                        {
                            if (message.Contains("~PoolAllCount~"))
                            {
                                if (!poolAllCounter.ContainsKey(requestId))
                                    poolAllCounter[requestId] = 1;
                                else
                                    poolAllCounter[requestId] = poolAllCounter[requestId] + 1;

                                if (poolAllCounter[requestId] == int.Parse(message["~PoolAllCount~"]))
                                {
                                    messageResponses.Remove(requestId);
                                    poolAllCounter.Remove(requestId);
                                }
                            }
                            else
                            {

                                messageResponses.Remove(requestId);

                            }
                        }
                        if (callback != null)
                            callback(message);
                    }
                    else
                    {
                        Console.WriteLine(string.Join(",", messageResponses.Keys.ToArray()));
                        throw new Exception("Cannot find response callback  " + message);
                    }

                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }


        }

        public bool SendMessage(SocketManager socketManager, Query message, Action<Query> callback)
        {
            messageResponses[socketManager.Id+ message.RequestKey] = callback;


            if (message.From == null)
                message.From = socketManager.Id;
            return socketManager.SendMessage(message);

        }

        public bool FowardMessage(SocketManager socketManager, Query message, Action<Query> callback)
        {
            if (socketManager == null)
            {
                throw new Exception("socket not found " + message.ToString());
            }

            var responseKey = message.RequestKey;
            messageResponses[socketManager.Id + responseKey] = callback;

            if (message.From == null)
                message.From = socketManager.Id;
            return socketManager.SendMessage(message);

        }

        private void ClientMessage(Client client, Query query, Action<Query> respond)
        {
            switch (query.Type)
            {
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
                    switch (query.Method)
                    {
                        case "GetClientId":
                            {
                                respond(Query.Build(query.Method, QueryDirection.Response, QueryType.Client, client.Id));
                                break;
                            }
                        case "GetAllPools":
                            {
                                var response = GetAllPools();
                                respond(Query.Build(query.Method, QueryDirection.Response, QueryType.Client, response));
                                break;
                            }
                        case "OnPoolUpdated":
                            {
                                var pool = getPoolByName(query["PoolName"]);
                                pool.OnClientChange(client, () =>
                                {
                                    respond(Query.Build(query.Method, QueryDirection.Response, QueryType.Client, GetClientsInPool(query["PoolName"])));
                                });
                                respond(Query.Build(query.Method, QueryDirection.Response, QueryType.Client, GetClientsInPool(query["PoolName"])));

                                break;
                            }
                        case "JoinPool":
                            {
                                JoinPool(client, query["PoolName"]);
                                respond(Query.Build(query.Method, QueryDirection.Response, QueryType.Client));
                                break;
                            }

                        case "GetClients":
                            {
                                var response = GetClientsInPool(query["PoolName"]);
                                respond(Query.Build(query.Method, QueryDirection.Response, QueryType.Client, response));
                                break;
                            }
                        default: throw new Exception("Method not found: " + query.Method);
                    }
                    break;
                default:
                    throw new Exception("Type not found " + query);
            }


        }

        public void AddClient(SocketManager socketManager)
        {
            var client = new Client(socketManager, socketManager.Id);
            Clients.Add(client);
        }

        public Client GetClient(string id)
        {
            return Clients.FirstOrDefault(a => a.Id == id);
        }

        public void RemoveClient(SocketManager socketManager)
        {
            var client = Clients.First(a => a.Id == socketManager.Id);
            Clients.Remove(client);
            foreach (var key in messageResponses.Keys.ToArray())
            {
                if (key.StartsWith(client.Id))
                {
                    messageResponses.Remove(key);
                }
            }
            foreach (var key in poolAllCounter.Keys.ToArray())
            {
                if (key.StartsWith(client.Id))
                {
                    poolAllCounter.Remove(key);
                }
            }

            for (var index = pools.Count - 1; index >= 0; index--)
            {
                var serverPool = pools[index];
                if (serverPool.ContainsClient(client))
                {
                    serverPool.RemoveClient(client);
                    if (serverPool.IsEmpty())
                    {
                        pools.Remove(serverPool);
                    }
                }
            }
        }

        public GetAllPoolsResponse GetAllPools()
        {
            return new GetAllPoolsResponse
            {
                PoolNames = pools.Select(a => a.Name).ToArray()
            };
        }

        public GetPoolByNameResponse GetPoolByName(string poolName)
        {
            var pool = getPoolByName(poolName);

            return new GetPoolByNameResponse
            {
                PoolName = pool.Name
            };
        }

        private Pool getPoolByName(string poolName)
        {
            var pool = pools.FirstOrDefault(a => a.Name == poolName);

            if (pool == null)
                pools.Add(pool = new Pool(poolName));
            return pool;
        }

        public void JoinPool(Client client, string poolName)
        {
            var pool = getPoolByName(poolName);
            if (pool.ContainsClient(client)) return;

            pool.AddClient(client);
        }

        public GetClientByPoolResponse GetClientsInPool(string poolName)
        {
            var pool = getPoolByName(poolName);
            return new GetClientByPoolResponse
            {
                Clients = pool.GetClientsResponse()
            };
        }

        public void ForwardMessageToClient(Query query, Action<Query> respond)
        {
            var client = Clients.FirstOrDefault(a => a.Id == query.To);
            FowardMessage(client?.SocketManager, query, respond);
        }

        public void ForwardMessageToPool(Query query, Action<Query> respond)
        {
            var poolName = query.To;
            var pool = getPoolByName(poolName);
            var client = pool.GetRoundRobin();
            var rQuery = new Query(query);
            if (client == null)
            {
                Console.WriteLine("No round robin found " + query);
                //todo idk, maybe tell the caller theres no round robin
                return;
            }
            FowardMessage(client.SocketManager, rQuery, (q) =>
            {
                respond(q);
            });
        }

        public void ForwardMessageToPoolAll(Query query, Action<Query> respond)
        {
            var poolName = query.To;
            var pool = getPoolByName(poolName);
            var count = pool.NumberOfClients;
            foreach (var socket in pool.GetClientsSockets())
            {
                var rQuery = new Query(query);
                rQuery.Add("~PoolAllCount~", count.ToString());
                FowardMessage(socket, rQuery, respond);
            }
        }



        public void Disconnect()
        {
            serverManager.Disconnect();
        }
    }
}