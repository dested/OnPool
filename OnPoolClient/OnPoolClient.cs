using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolClient
{
    public delegate void OnMessageWithResponse(Client from, Query message, Action<Query> respond);


    public class OnPoolClient
    {
        private readonly Dictionary<string, Action<Query>> messageResponses = new Dictionary<string, Action<Query>>();
        private readonly Dictionary<string, int> poolAllCounter = new Dictionary<string, int>();
        private readonly List<Pool> pools = new List<Pool>();

        private Action onReady;
        private SocketManager server;
        private readonly List<Client> clients = new List<Client>();
        private Action onDisconnect;
        private OnMessageWithResponse onMessageWithResponse;

        public string MyClientId => server.Id;

        public void ConnectToServer(string ip)
        {
            server = new SocketManager("127.0.0.1", (_, query) => messageProcess(query));
            server.OnDisconnect += _ => onDisconnect?.Invoke();
            server.StartFromClient();
            GetClientId(id =>
            {
                server.Id = id;
                onReady?.Invoke();
            });
        }

        private void messageProcess(Query query)
        {
            Client fromClient;
            if (query.Contains("~FromClient~"))
                fromClient = getClientById(query["~FromClient~"]);
            else
                fromClient = getClientById(server.Id);


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
                onReceiveMessageWithResponse(fromClient, query, queryResponse =>
                    {
                        queryResponse.Add("~Response~");
                        queryResponse.Add("~ResponseKey~", receiptId);
                        sendMessageWithResponse(queryResponse, null);
                    }
                );
            }
            else
            {
                throw new Exception("Idk");
            }
        }

        private Client getClientById(string id)
        {
            var client = clients.FirstOrDefault(a => a.Id == id);
            if (client == null)
            {
                client = new Client(this, id);
                clients.Add(client);
            }
            return client;
        }

        public void OnReady(Action callback)
        {
            onReady = callback;
        }

        public void OnDisconnect(Action callback)
        {
            onDisconnect = callback;
        }


        public void OnMessageWithResponse(OnMessageWithResponse callback)
        {
            onMessageWithResponse += callback;
        }

        private void onReceiveMessageWithResponse(Client from, Query query, Action<Query> respond)
        {
            if (query.Contains("~ToClient~"))
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



        public void GetClientId(Action<string> callback)
        {
            var query = Query.Build("GetClientId");
            sendMessageWithResponse(query, response => { callback(response.GetJson<string>()); });
        }



        public void SendMessageWithResponse(string clientId, Query query, Action<Query> callback)
        {
            query.Add("~ToClient~", clientId);
            sendMessageWithResponse(query, callback);
        }

        internal bool sendMessageWithResponse(Query query, Action<Query> callback)
        {
            if (callback != null)
            {
                var responseKey = Guid.NewGuid().ToString("N");
                query.Add("~ResponseKey~", responseKey);
                messageResponses[responseKey] = callback;
            }
            else
            {
                
            }

            if (server.Id != null && !query.Contains("~FromClient~"))
                query["~FromClient~"] = server.Id;
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
                    pools.Add(pool = new Pool(this, getPoolByNameResponse.PoolName, getClientById));

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