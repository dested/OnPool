using System;
using System.Collections.Generic;
using System.Linq;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerClient
{

    public delegate void GetSwimmerIdResponse(string id);
    public delegate void GetPoolCallback(BrokerPool pool);
    public delegate void GetAllPoolsCallback(GetAllPoolsResponse response);
    public delegate void GetSwimmersCallback(BrokerPoolSwimmer[] swimmers);
    public delegate void JoinPoolCallback();

    public class ClientBrokerManager
    {
        internal ClientConnection client;
        private List<BrokerPool> pools { get; } = new List<BrokerPool>();
        public string MySwimmerId => client.Id;

        public Action OnDisconnect { get; set; }
        public Action OnReady { get; set; }
        public Action<Query> OnMessage { get; set; }
        public Action<Query, Action<Query>> OnMessageWithResponse { get; set; }


        public void ConnectToBroker(string ip)
        {
            client = new ClientConnection("127.0.0.1");
            client.OnMessage += (_, message) => onMessage(message);
            client.OnMessageWithResponse += (_, message, respond) => onMessageWithResponse(message, respond);
            client.OnDisconnect += _ => OnDisconnect?.Invoke();
            client.StartFromClient();
            GetSwimmerId((id) =>
            {
                client.Id = id;
                this.OnReady?.Invoke();
            });
        }

        private void onMessageWithResponse(Query query, Action<Query> respond)
        {
            if (query.Contains("~ToSwimmer~"))
            {
                OnMessageWithResponse?.Invoke(query, respond);
                return;
            }
            if (query.Contains("~ToPool~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPool~"]);
                pool?.OnMessageWithResponse?.Invoke(query, respond);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPoolAll~"]);
                pool?.OnMessageWithResponse?.Invoke(query, respond);
                return;
            }
        }



        private void onMessage(Query query)
        {
            if (query.Contains("~ToSwimmer~"))
            {
                OnMessage?.Invoke(query);
                return;
            }
            if (query.Contains("~ToPool~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPool~"]);
                pool?.OnMessage(query);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPoolAll~"]);
                pool?.OnMessage(query);
                return;
            }
        }


        public void GetSwimmerId(GetSwimmerIdResponse callback)
        {
            var query = Query.Build("GetSwimmerId");

            client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<string>());
            });
        }


        public void GetPool(string poolName, GetPoolCallback callback)
        {
            var query = Query.Build("GetPool", new QueryParam("PoolName", poolName));

            client.SendMessageWithResponse(query, (response) =>
            {
                var getPoolByNameResponse = response.GetJson<GetPoolByNameResponse>();
                BrokerPool pool = pools.FirstOrDefault(a => a.PoolName == getPoolByNameResponse.PoolName);
                if (pool == null)
                {
                    pools.Add(pool = new BrokerPool(this, getPoolByNameResponse));
                }

                pool.PoolName = getPoolByNameResponse.PoolName;
                pool.NumberOfSwimmers = getPoolByNameResponse.NumberOfSwimmers;
                callback(pool);
            });
        }
        public void GetAllPools(string poolName, GetAllPoolsCallback callback)
        {
            var query = Query.Build("GetAllPools");

            client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<GetAllPoolsResponse>());
            });
        }
    }
}