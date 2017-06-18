using System;
using System.Collections.Generic;
using System.Linq;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerServer
{
    public class ServerBroker : IServerBroker
    {
        private ServerManager serverManager;
        private List<Swimmer> Swimmers = new List<Swimmer>();
        private List<ServerPool> Pools { get; set; } = new List<ServerPool>();

        public ServerBroker()
        {
            this.serverManager = new ServerManager(
                AddSwimmer,
                RemoveSwimmer,
                GetSwimmer,
                ClientMessage,
                ClientMessageWithResponse
            );
            this.serverManager.StartServer();
        }


        private void ClientMessage(Swimmer swimmer, Query query)
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

        private void ClientMessageWithResponse(Swimmer swimmer, Query query, Action<Query> respond)
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
            var swimmer = new Swimmer(client, client.Id);
            this.Swimmers.Add(swimmer);
        }
        public Swimmer GetSwimmer(string id)
        {
            return this.Swimmers.FirstOrDefault(a => a.Id == id);
        }

        public void RemoveSwimmer(SocketLayer client)
        {
            var swimmer = this.Swimmers.First(a => a.Id == client.Id);
            this.Swimmers.Remove(swimmer);
            for (var index = Pools.Count - 1; index >= 0; index--)
            {
                var serverPool = Pools[index];
                if (serverPool.Swimmers.Contains(swimmer))
                {
                    serverPool.Swimmers.Remove(swimmer);
                    if (serverPool.Swimmers.Count == 0)
                    {
                        Pools.Remove(serverPool);
                    }
                }
            }
        }

        public GetAllPoolsResponse GetAllPools()
        {
            return new GetAllPoolsResponse()
            {
                PoolNames = Pools.Select(a => a.Name).ToArray()
            };
        }

        public GetPoolByNameResponse GetPoolByName(string poolName)
        {
            var pool = getPoolByName(poolName);

            return new GetPoolByNameResponse()
            {
                PoolName = pool.Name,
            };
        }

        private ServerPool getPoolByName(string poolName)
        {
            ServerPool pool = Pools.FirstOrDefault(a => a.Name == poolName);

            if (pool == null)
            {
                Pools.Add(pool = new ServerPool()
                {
                    Swimmers = new List<Swimmer>(),
                    Name = poolName
                });
            }
            return pool;
        }

        public void JoinPool(Swimmer client, string poolName)
        {
            var pool = getPoolByName(poolName);
            if (pool.Swimmers.Contains(client)) return;

            pool.Swimmers.Add(client);
        }

        public GetSwimmerByPoolResponse GetSwimmersInPool(string poolName)
        {
            var pool = getPoolByName(poolName);
            return new GetSwimmerByPoolResponse()
            {
                Swimmers = pool.Swimmers.Select(a => new SwimmerResponse() { Id = a.Id }).ToArray()
            };
        }

        public void ForwardMessageToSwimmerWithResponse(Query query, Action<Query> respond)
        {
            var swimmer = this.Swimmers.FirstOrDefault(a => a.Id == query["~ToSwimmer~"]);
            swimmer?.Client.SendMessageWithResponse(query, respond);
        }

        public void ForwardMessageToPoolWithResponse(Query query, Action<Query> respond)
        {
            var poolName = query["~ToPool~"];
            var pool = getPoolByName(poolName);
            var swimmer = pool.GetRoundRobin();
            var rQuery = new Query(query);
            swimmer?.Client.SendMessageWithResponse(rQuery, respond);
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
                swimmer.Client.SendMessageWithResponse(rQuery, respond);
            }
        }

        public void ForwardMessageToSwimmer(Query query)
        {
            var swimmer = this.Swimmers.FirstOrDefault(a => a.Id == query["~ToSwimmer~"]);
            swimmer?.Client.SendMessage(query);
        }

        public void ForwardMessageToPool(Query query)
        {
            var poolName = query["~ToPool~"];
            var pool = getPoolByName(poolName);
            var clientConnection = pool.GetRoundRobin();
            var rQuery = new Query(query);
            clientConnection?.Client.SendMessage(rQuery);
        }

        public void ForwardMessageToPoolAll(Query query)
        {
            var poolName = query["~ToPoolAll~"];
            var pool = getPoolByName(poolName);
            foreach (var clientConnection in pool.Swimmers)
            {
                var rQuery = new Query(query);
                clientConnection.Client.SendMessage(rQuery);
            }
        }

        public void Disconnect()
        {
            serverManager.Disconnect();
        }
    }
}