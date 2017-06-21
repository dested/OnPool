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
                    var socketManager = new SocketManager(socket, onMessage);
                    socketManager.OnDisconnect += RemoveClient;
                    AddClient(socketManager);
                    socketManager.Start();
                }
            );
            serverManager.StartServer();
            threadManager.Process();
        }

        private void onMessage(SocketManager socketManager, Query query)
        {
            Client fromClient;
            if (query.Contains("~FromClient~"))
                fromClient = GetClient(query["~FromClient~"]);
            else
                fromClient = GetClient(socketManager.Id);


            if (query.Contains("~Response~"))
            {
                query.Remove("~Response~");
                if (messageResponses.ContainsKey(query["~ResponseKey~"]))
                {
                    var callback = messageResponses[query["~ResponseKey~"]];

                    if (query.Contains("~PoolAllCount~"))
                    {
                        if (!poolAllCounter.ContainsKey(query["~ResponseKey~"]))
                            poolAllCounter[query["~ResponseKey~"]] = 1;
                        else
                            poolAllCounter[query["~ResponseKey~"]] =
                                poolAllCounter[query["~ResponseKey~"]] + 1;

                        if (poolAllCounter[query["~ResponseKey~"]] == int.Parse(query["~PoolAllCount~"]))
                        {
                            messageResponses.Remove(query["~ResponseKey~"]);
                            poolAllCounter.Remove(query["~ResponseKey~"]);
                        }
                    }
                    else
                    {
                        messageResponses.Remove(query["~ResponseKey~"]);
                    }
                    query.Remove("~ResponseKey~");
                    callback(query);
                }
                else
                {
                    throw new Exception("Cannot find response callback");
                }
            }
            else if (query.Contains("~ResponseKey~"))
            {
                var receiptId = query["~ResponseKey~"];
                query.Remove("~ResponseKey~");
                ClientMessageWithResponse(fromClient, query, queryResponse =>
                    {
                        queryResponse.Add("~Response~");
                        queryResponse.Add("~ResponseKey~", receiptId);
                        SendMessageWithResponse(socketManager, queryResponse,null);
                    }
                );
            }
            else
            {
                throw new Exception("Idk");
            }
        }

        public bool SendMessageWithResponse(SocketManager socketManager, Query message, Action<Query> callback)
        {
            if (!message.Contains("~Response~"))
            {
                var responseKey = Guid.NewGuid().ToString("N");
                message.Add("~ResponseKey~", responseKey);
                messageResponses[responseKey] = callback;
            }

            if (!message.Contains("~FromClient~"))
                message["~FromClient~"] = socketManager.Id;
            return socketManager.SendMessage(message);

        }

        private void ClientMessageWithResponse(Client client, Query query, Action<Query> respond)
        {
            if (query.Contains("~ToClient~"))
            {
                ForwardMessageToClientWithResponse(query, respond);
                return;
            }
            if (query.Contains("~ToPool~"))
            {
                ForwardMessageToPoolWithResponse(query, respond);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                ForwardMessageToPoolAllWithResponse(query, respond);
                return;
            }


            switch (query.Method)
            {
                case "GetClientId":
                {
                    respond(Query.Build(query.Method, client.Id));
                    break;
                }
                case "GetAllPools":
                {
                    var response = GetAllPools();
                    respond(Query.Build(query.Method, response));
                    break;
                }

                case "GetPool":
                {
                    var response = GetPoolByName(query["PoolName"]);
                    respond(Query.Build(query.Method, response));
                    break;
                }

                case "JoinPool":
                {
                    JoinPool(client, query["PoolName"]);
                    respond(Query.Build(query.Method));
                    break;
                }

                case "GetClients":
                {
                    var response = GetClientsInPool(query["PoolName"]);
                    respond(Query.Build(query.Method, response));
                    break;
                }
                default: throw new Exception("Method not found: " + query.Method);
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
            for (var index = pools.Count - 1; index >= 0; index--)
            {
                var serverPool = pools[index];
                if (serverPool.Clients.Contains(client))
                {
                    serverPool.Clients.Remove(client);
                    if (serverPool.Clients.Count == 0)
                        pools.Remove(serverPool);
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
                pools.Add(pool = new Pool
                {
                    Clients = new List<Client>(),
                    Name = poolName
                });
            return pool;
        }

        public void JoinPool(Client client, string poolName)
        {
            var pool = getPoolByName(poolName);
            if (pool.Clients.Contains(client)) return;

            pool.Clients.Add(client);
        }

        public GetClientByPoolResponse GetClientsInPool(string poolName)
        {
            var pool = getPoolByName(poolName);
            return new GetClientByPoolResponse
            {
                Clients = pool.Clients.Select(a => new ClientResponse {Id = a.Id}).ToArray()
            };
        }

        public void ForwardMessageToClientWithResponse(Query query, Action<Query> respond)
        {
            var client = Clients.FirstOrDefault(a => a.Id == query["~ToClient~"]);
            SendMessageWithResponse(client?.SocketManager, query, respond);
        }

        public void ForwardMessageToPoolWithResponse(Query query, Action<Query> respond)
        {
            var poolName = query["~ToPool~"];
            var pool = getPoolByName(poolName);
            var client = pool.GetRoundRobin();
            var rQuery = new Query(query);
            SendMessageWithResponse(client?.SocketManager, rQuery, respond);
        }

        public void ForwardMessageToPoolAllWithResponse(Query query, Action<Query> respond)
        {
            var poolName = query["~ToPoolAll~"];
            var pool = getPoolByName(poolName);
            var clients = pool.Clients.ToArray();
            for (var index = 0; index < clients.Length; index++)
            {
                var client = clients[index];
                var rQuery = new Query(query);
                rQuery.Add("~PoolAllCount~", clients.Length.ToString());
                SendMessageWithResponse(client?.SocketManager, rQuery, respond);
            }
        }

     

        public void Disconnect()
        {
            serverManager.Disconnect();
        }
    }
}