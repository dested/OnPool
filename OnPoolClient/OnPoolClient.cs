using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolClient
{
    public delegate void OnMessage(Swimmer from, Query message);

    public delegate void OnMessageWithResponse(Swimmer from, Query message, Action<Query> respond);


    public class OnPoolClient
    {
        private readonly Dictionary<string, Action<Query>> messageResponses = new Dictionary<string, Action<Query>>();
        private readonly Dictionary<string, int> poolAllCounter = new Dictionary<string, int>();
        private readonly List<Pool> pools = new List<Pool>();

        private Action onReady;
        private SocketManager server;
        private readonly List<Swimmer> swimmers = new List<Swimmer>();
        private Action onDisconnect;
        private OnMessage onMessage;
        private OnMessageWithResponse onMessageWithResponse;

        public string MySwimmerId => server.Id;


        public void ConnectToServer(string ip)
        {
            server = new SocketManager("127.0.0.1", (_, query) => messageProcess(query));
            server.OnDisconnect += _ => onDisconnect?.Invoke();
            server.StartFromClient();
            GetSwimmerId(id =>
            {
                server.Id = id;
                onReady?.Invoke();
            });
        }

        private void messageProcess(Query query)
        {
            Swimmer fromSwimmer;
            if (query.Contains("~FromSwimmer~"))
                fromSwimmer = getSwimmerById(query["~FromSwimmer~"]);
            else
                fromSwimmer = getSwimmerById(server.Id);


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
                onReceiveMessageWithResponse(fromSwimmer, query, queryResponse =>
                    {
                        queryResponse.Add("~Response~");
                        queryResponse.Add("~ResponseKey~", receiptId);
                        sendMessage(queryResponse);
                    }
                );
            }
            else
            {
                onReceiveMessage(fromSwimmer, query);
            }
        }

        private Swimmer getSwimmerById(string id)
        {
            var swimmer = swimmers.FirstOrDefault(a => a.Id == id);
            if (swimmer == null)
            {
                swimmer = new Swimmer(this, id);
                swimmers.Add(swimmer);
            }
            return swimmer;
        }

        public void OnReady(Action callback)
        {
            onReady = callback;
        }

        public void OnDisconnect(Action callback)
        {
            onDisconnect = callback;
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
                pool?.ReceiveMessageWithResponse(from, query, respond);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPoolAll~"]);
                pool?.ReceiveMessageWithResponse(from, query, res =>
                {
                    res.Add("~PoolAllCount~", query["~PoolAllCount~"]);
                    respond(res);
                });
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
                pool?.ReceiveMessage(from, query);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                var pool = pools.FirstOrDefault(a => a.PoolName == query["~ToPoolAll~"]);
                pool?.ReceiveMessage(from, query);
            }
        }


        public void GetSwimmerId(Action<string> callback)
        {
            var query = Query.Build("GetSwimmerId");
            sendMessageWithResponse(query, response => { callback(response.GetJson<string>()); });
        }


        public void SendMessage(string swimmerId, Query query)
        {
            query.Add("~ToSwimmer~", swimmerId);
            sendMessage(query);
        }

        public void SendMessageWithResponse(string swimmerId, Query query, Action<Query> callback)
        {
            query.Add("~ToSwimmer~", swimmerId);
            sendMessageWithResponse(query, callback);
        }

        internal void sendMessageWithResponse(Query query, Action<Query> callback)
        {
            var responseKey = Guid.NewGuid().ToString("N");
            query.Add("~ResponseKey~", responseKey);
            messageResponses[responseKey] = callback;
            sendMessage(query);
        }

        internal bool sendMessage(Query query)
        {
            if (server.Id != null && !query.Contains("~FromSwimmer~"))
                query["~FromSwimmer~"] = server.Id;
            return server.SendMessage(query);
        }

        public void GetPool(string poolName, Action<Pool> callback)
        {
            var pool = pools.FirstOrDefault(a => a.PoolName == poolName);
            if (pool != null)
            {
                callback(pool);
                return;
            }

            var query = Query.Build("GetPool", new QueryParam("PoolName", poolName));

            sendMessageWithResponse(query, response =>
            {
                var getPoolByNameResponse = response.GetJson<GetPoolByNameResponse>();
                pool = pools.FirstOrDefault(a => a.PoolName == getPoolByNameResponse.PoolName);
                if (pool == null)
                    pools.Add(pool = new Pool(this, getPoolByNameResponse.PoolName, getSwimmerById));

                pool.PoolName = getPoolByNameResponse.PoolName;
                callback(pool);
            });
        }

        public void GetAllPools(string poolName, Action<GetAllPoolsResponse> callback)
        {
            var query = Query.Build("GetAllPools");

            sendMessageWithResponse(query, response => { callback(response.GetJson<GetAllPoolsResponse>()); });
        }

        public void Disconnet()
        {
            server.ForceDisconnect();
        }
    }
}