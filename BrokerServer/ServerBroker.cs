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
        private List<ClientConnection> Swimmers = new List<ClientConnection>();
        private List<ServerPool> Pools { get; set; } = new List<ServerPool>();

        public ServerBroker()
        {
            this.serverManager = new ServerManager(this);
            this.serverManager.StartServer();
        }


        public void AddSwimmer(ClientConnection client)
        {
            this.Swimmers.Add(client);
        }

        public void RemoveSwimmer(ClientConnection client)
        {
            this.Swimmers.Remove(client);
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
                NumberOfSwimmers = pool.Swimmers.Count
            };
        }

        private ServerPool getPoolByName(string poolName)
        {
            ServerPool pool = Pools.FirstOrDefault(a => a.Name == poolName);

            if (pool == null)
            {
                Pools.Add(pool = new ServerPool()
                {
                    Swimmers = new List<ClientConnection>(),
                    Name = poolName
                });
            }
            return pool;
        }

        public void JoinPool(ClientConnection client, string poolName)
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

        public void SendMessageToSwimmerWithResponse(Query query, Action<Query> respond)
        {
            var swimmer = this.Swimmers.FirstOrDefault(a => a.Id == query["~ToSwimmer~"]);
            swimmer?.SendMessageWithResponse(query, respond);
        }

        public void SendMessageToPoolWithResponse(Query query, Action<Query> respond)
        {
            var poolName = query["~ToPool~"];
            var pool = getPoolByName(poolName);
            var clientConnection = pool.GetRoundRobin();
            var rQuery = new Query(query);
            clientConnection?.SendMessageWithResponse(rQuery, respond);
        }

        public void SendMessageToPoolAllWithResponse(Query query, Action<Query> respond)
        {
            var poolName = query["~ToPoolAll~"];
            var pool = getPoolByName(poolName);
            var swimmers = pool.Swimmers.ToArray();
            for (var index = 0; index < swimmers.Length; index++)
            {
                var swimmer = swimmers[index];
                var rQuery = new Query(query);
                rQuery.Add("~PoolAllCount~", swimmers.Length.ToString());
                swimmer.SendMessageWithResponse(rQuery, respond);
            }
        }

        public void SendMessageToSwimmer(Query query)
        {
            var swimmer = this.Swimmers.FirstOrDefault(a => a.Id == query["~ToSwimmer~"]);
            swimmer?.SendMessage(query);
        }

        public void SendMessageToPool(Query query)
        {
            var poolName = query["~ToPool~"];
            var pool = getPoolByName(poolName);
            var clientConnection = pool.GetRoundRobin();
            var rQuery = new Query(query);
            clientConnection?.SendMessage(rQuery);
        }

        public void SendMessageToPoolAll(Query query)
        {
            var poolName = query["~ToPoolAll~"];
            var pool = getPoolByName(poolName);
            foreach (var clientConnection in pool.Swimmers)
            {
                var rQuery = new Query(query);
                clientConnection.SendMessage(rQuery);
            }
        }

        public void Disconnect()
        {
            serverManager.Disconnect();
        }
    }
}