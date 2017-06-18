using System;
using System.Collections.Generic;
using System.Linq;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerClient
{
    public class ClientBrokerManager
    {
        internal ClientConnection client;
        private List<ClientPool> pools { get; } = new List<ClientPool>();
        public string MySwimmerId => client.Id;

        private Action onReady;
        private Action onDisconnect { get; set; }
        private Action<Query> onMessage { get; set; }
        private Action<Query, Action<Query>> onMessageWithResponse { get; set; }


        public void ConnectToBroker(string ip)
        {
            client = new ClientConnection("127.0.0.1");
            client.OnMessage += (_, message) => onReceiveMessage(message);
            client.OnMessageWithResponse += (_, message, respond) => onReceiveMessageWithResponse(message, respond);
            client.OnDisconnect += _ => onDisconnect?.Invoke();
            client.StartFromClient();
            GetSwimmerId((id) =>
            {
                Console.WriteLine("Got ClientId " + id);

                client.Id = id;
                this.onReady?.Invoke();
            });
        }

        public void OnReady(Action callback)
        {
            this.onReady = callback;
        }
        public void OnDisconnect(Action callback)
        {
            this.onDisconnect = callback;
        }

        public void OnMessage(Action<Query> callback)
        {
            onMessage += callback;
        }
        public void OnMessageWithResponse(Action<Query, Action<Query>> callback)
        {
            onMessageWithResponse += callback;
        }

        private void onReceiveMessageWithResponse(Query query, Action<Query> respond)
        {
            if (query.Contains("~ToSwimmer~"))
            {
                onMessageWithResponse?.Invoke(query, respond);
                return;
            }
            if (query.Contains("~ToPool~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPool~"]);
                pool?.onMessageWithResponse?.Invoke(query, respond);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPoolAll~"]);
                pool?.onMessageWithResponse?.Invoke(query, (res) =>
                {
                    res.Add("~PoolAllCount~", query["~PoolAllCount~"]);
                    respond(res);
                });
                return;
            }
        }



        private void onReceiveMessage(Query query)
        {
            if (query.Contains("~ToSwimmer~"))
            {
                onMessage?.Invoke(query);
                return;
            }
            if (query.Contains("~ToPool~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPool~"]);
                pool?.onMessage.Invoke(query);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPoolAll~"]);
                pool?.onMessage.Invoke(query);
                return;
            }
        }


        public void GetSwimmerId(Action<string> callback)
        {
            var query = Query.Build("GetSwimmerId");

            client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<string>());
            });
        }


        public void GetPool(string poolName, Action<ClientPool> callback)
        {
            var pool = pools.FirstOrDefault(a => a.PoolName == poolName);
            if (pool != null)
            {
                callback(pool);
                return;
            }

            var query = Query.Build("GetPool", new QueryParam("PoolName", poolName));

            client.SendMessageWithResponse(query, (response) =>
            {
                var getPoolByNameResponse = response.GetJson<GetPoolByNameResponse>();
                pool = pools.FirstOrDefault(a => a.PoolName == getPoolByNameResponse.PoolName);
                if (pool == null)
                {
                    pools.Add(pool = new ClientPool(this, getPoolByNameResponse));
                }

                pool.PoolName = getPoolByNameResponse.PoolName;
                callback(pool);
            });
        }

        public void GetAllPools(string poolName, Action<GetAllPoolsResponse> callback)
        {
            var query = Query.Build("GetAllPools");

            client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<GetAllPoolsResponse>());
            });
        }

        public void Disconnet()
        {
            client.ForceDisconnect();
        }
    }
}