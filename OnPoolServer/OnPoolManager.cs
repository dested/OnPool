using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolServer
{
    public class OnPoolManager
    {
        private readonly List<ServerPool> pools = new List<ServerPool>();
        private readonly ClientListener serverManager;
        public readonly List<ServerSwimmer> _swimmers = new List<ServerSwimmer>();


        private readonly Dictionary<string, Action<Query>> messageResponses = new Dictionary<string, Action<Query>>();
        private readonly Dictionary<string, int> poolAllCounter = new Dictionary<string, int>();

        public OnPoolManager()
        {
            serverManager = new ClientListener(socket =>
                {
                    var client = new SocketLayer(socket, onMessage);
                    client.OnDisconnect += RemoveSwimmer;
                    AddSwimmer(client);
                    client.Start();
                }
            );
            serverManager.StartServer();
        }

        private void onMessage(SocketLayer socket, Query query)
        {
            ServerSwimmer fromSwimmer;
            if (query.Contains("~FromSwimmer~"))
                fromSwimmer = GetSwimmer(query["~FromSwimmer~"]);
            else
                fromSwimmer = GetSwimmer(socket.Id);


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
                ClientMessageWithResponse(fromSwimmer, query, queryResponse =>
                    {
                        queryResponse.Add("~Response~");
                        queryResponse.Add("~ResponseKey~", receiptId);
                        sendMessage(socket, queryResponse);
                    }
                );
            }
            else
            {
                ClientMessage(fromSwimmer, query);
            }
        }

        public bool sendMessage(SocketLayer socket, Query query)
        {
            if (!query.Contains("~FromSwimmer~"))
                query["~FromSwimmer~"] = socket.Id;
            return socket.SendMessage(query);
        }

        public bool SendMessageWithResponse(SocketLayer socket, Query message, Action<Query> callback)
        {
            var responseKey = Guid.NewGuid().ToString("N");
            message.Add("~ResponseKey~", responseKey);
            messageResponses[responseKey] = callback;

            return sendMessage(socket, message);
        }


        private void ClientMessage(ServerSwimmer swimmer, Query query)
        {
            if (query.Contains("~ToSwimmer~"))
            {
                ForwardMessageToSwimmer(query);
                return;
            }
            if (query.Contains("~ToPool~"))
            {
                ForwardMessageToPool(query);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                ForwardMessageToPoolAll(query);
                return;
            }

            throw new Exception("Method not found: " + query.Method);
        }

        private void ClientMessageWithResponse(ServerSwimmer swimmer, Query query, Action<Query> respond)
        {
            if (query.Contains("~ToSwimmer~"))
            {
                ForwardMessageToSwimmerWithResponse(query, respond);
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
                case "GetSwimmerId":
                {
                    respond(Query.Build(query.Method, swimmer.Id));
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
                    JoinPool(swimmer, query["PoolName"]);
                    respond(Query.Build(query.Method));
                    break;
                }

                case "GetSwimmers":
                {
                    var response = GetSwimmersInPool(query["PoolName"]);
                    respond(Query.Build(query.Method, response));
                    break;
                }
                default: throw new Exception("Method not found: " + query.Method);
            }
        }

        public void AddSwimmer(SocketLayer client)
        {
            var swimmer = new ServerSwimmer(client, client.Id);
            _swimmers.Add(swimmer);
        }

        public ServerSwimmer GetSwimmer(string id)
        {
            return _swimmers.FirstOrDefault(a => a.Id == id);
        }

        public void RemoveSwimmer(SocketLayer client)
        {
            var swimmer = _swimmers.First(a => a.Id == client.Id);
            _swimmers.Remove(swimmer);
            for (var index = pools.Count - 1; index >= 0; index--)
            {
                var serverPool = pools[index];
                if (serverPool.Swimmers.Contains(swimmer))
                {
                    serverPool.Swimmers.Remove(swimmer);
                    if (serverPool.Swimmers.Count == 0)
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

        private ServerPool getPoolByName(string poolName)
        {
            var pool = pools.FirstOrDefault(a => a.Name == poolName);

            if (pool == null)
                pools.Add(pool = new ServerPool
                {
                    Swimmers = new List<ServerSwimmer>(),
                    Name = poolName
                });
            return pool;
        }

        public void JoinPool(ServerSwimmer client, string poolName)
        {
            var pool = getPoolByName(poolName);
            if (pool.Swimmers.Contains(client)) return;

            pool.Swimmers.Add(client);
        }

        public GetSwimmerByPoolResponse GetSwimmersInPool(string poolName)
        {
            var pool = getPoolByName(poolName);
            return new GetSwimmerByPoolResponse
            {
                Swimmers = pool.Swimmers.Select(a => new SwimmerResponse {Id = a.Id}).ToArray()
            };
        }

        public void ForwardMessageToSwimmerWithResponse(Query query, Action<Query> respond)
        {
            var swimmer = _swimmers.FirstOrDefault(a => a.Id == query["~ToSwimmer~"]);
            SendMessageWithResponse(swimmer?.Socket, query, respond);
        }

        public void ForwardMessageToPoolWithResponse(Query query, Action<Query> respond)
        {
            var poolName = query["~ToPool~"];
            var pool = getPoolByName(poolName);
            var swimmer = pool.GetRoundRobin();
            var rQuery = new Query(query);
            SendMessageWithResponse(swimmer?.Socket, rQuery, respond);
        }

        public void ForwardMessageToPoolAllWithResponse(Query query, Action<Query> respond)
        {
            var poolName = query["~ToPoolAll~"];
            var pool = getPoolByName(poolName);
            var swimmers = pool.Swimmers.ToArray();
            for (var index = 0; index < swimmers.Length; index++)
            {
                var swimmer = swimmers[index];
                var rQuery = new Query(query);
                rQuery.Add("~PoolAllCount~", swimmers.Length.ToString());
                SendMessageWithResponse(swimmer?.Socket, rQuery, respond);
            }
        }

        public void ForwardMessageToSwimmer(Query query)
        {
            var swimmer = _swimmers.FirstOrDefault(a => a.Id == query["~ToSwimmer~"]);
            sendMessage(swimmer?.Socket, query);
        }

        public void ForwardMessageToPool(Query query)
        {
            var poolName = query["~ToPool~"];
            var pool = getPoolByName(poolName);
            var swimmer = pool.GetRoundRobin();
            var rQuery = new Query(query);
            sendMessage(swimmer?.Socket, rQuery);
        }

        public void ForwardMessageToPoolAll(Query query)
        {
            var poolName = query["~ToPoolAll~"];
            var pool = getPoolByName(poolName);
            foreach (var swimmer in pool.Swimmers)
            {
                var rQuery = new Query(query);
                sendMessage(swimmer?.Socket, rQuery);
            }
        }

        public void Disconnect()
        {
            serverManager.Disconnect();
        }
    }
}