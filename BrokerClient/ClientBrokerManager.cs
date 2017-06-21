using System;
using System.Collections.Generic;
using System.Linq;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerClient
{

    public class ClientBrokerManager
    {
        internal SocketLayer client;
        private List<ClientPool> pools { get; } = new List<ClientPool>();
        private List<Swimmer> swimmers { get; } = new List<Swimmer>();
        public string MySwimmerId => client.Id;

        private Action onReady;
        private Action onDisconnect { get; set; }
        private OnMessage onMessage { get; set; }
        private OnMessageWithResponse onMessageWithResponse { get; set; }


        public void ConnectToBroker(string ip)
        {
            client = new SocketLayer("127.0.0.1", getSwimmerById);
            client.OnMessage += onReceiveMessage;
            client.OnMessageWithResponse += onReceiveMessageWithResponse;
            client.OnDisconnect += _ => onDisconnect?.Invoke();
            client.StartFromClient();
            GetSwimmerId((id) =>
            {
                client.Id = id;
                this.onReady?.Invoke();
            });
        }

        private Swimmer getSwimmerById(string id)
        {
            var swimmer = swimmers.FirstOrDefault(a => a.Id == id);
            if (swimmer == null)
            {
                swimmer = new Swimmer(client, id);
                swimmers.Add(swimmer);
            }
            return swimmer;
        }

        public void OnReady(Action callback)
        {
            this.onReady = callback;
        }
        public void OnDisconnect(Action callback)
        {
            this.onDisconnect = callback;
        }

        public void OnMessage(OnMessage callback)
        {
            onMessage += callback;
        }
        public void OnMessageWithResponse(OnMessageWithResponse callback)
        {
            onMessageWithResponse += callback;
        }

        private void onReceiveMessageWithResponse(Swimmer from, Query query, Action<Query> respond)
        {
            if (query.Contains("~ToSwimmer~"))
            {
                onMessageWithResponse?.Invoke(from, query, respond);
                return;
            }
            if (query.Contains("~ToPool~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPool~"]);
                pool?.onMessageWithResponse?.Invoke(from, query, respond);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPoolAll~"]);
                pool?.onMessageWithResponse?.Invoke(from, query, (res) =>
                {
                    res.Add("~PoolAllCount~", query["~PoolAllCount~"]);
                    respond(res);
                });
                return;
            }
        }



        private void onReceiveMessage(Swimmer from, Query query)
        {
            if (query.Contains("~ToSwimmer~"))
            {
                onMessage?.Invoke(from, query);
                return;
            }
            if (query.Contains("~ToPool~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPool~"]);
                pool?.onMessage.Invoke(from, query);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPoolAll~"]);
                pool?.onMessage.Invoke(from, query);
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


        public void SendMessage(string swimmerId, Query query)
        {
            query.Add("~ToSwimmer~", swimmerId);
            client.SendMessage(query);
        }

        public void SendMessageWithResponse(string swimmerId, Query query, Action<Query> callback)
        {
            query.Add("~ToSwimmer~", swimmerId);
            client.SendMessageWithResponse(query, callback);
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
                    pools.Add(pool = new ClientPool(this, getPoolByNameResponse, getSwimmerById));
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