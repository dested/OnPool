using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolClient
{
    public delegate void RespondMessage(object payload);

    public delegate void OnMessage(Client from, Query message, RespondMessage respond);


    public class OnPoolClient
    {
        private SocketManager server;

        private readonly Dictionary<string, Action<Query>> messageResponses = new Dictionary<string, Action<Query>>();
        private readonly Dictionary<string, int> poolAllCounter = new Dictionary<string, int>();
        private readonly List<Client> clients = new List<Client>();
        private readonly List<Pool> pools = new List<Pool>();

        private Action onReady;
        private Action onDisconnect;
        private OnMessage onMessage;

        public string MyClientId => server.Id;

        public void ConnectToServer(string ip)
        {
            server = new SocketManager("127.0.0.1");
            server.onReceive += (_, query) => messageProcess(query);
            server.OnDisconnect += _ => onDisconnect?.Invoke();
            server.StartFromClient();
            GetClientId(id => {
                server.Id = id;
                onReady?.Invoke();
            });
        }

        private void messageProcess(Query message)
        {
            Client fromClient;
            if (message.From != null)
                fromClient = GetClientById(message.From);
            else
                fromClient = GetClientById(server.Id);

            switch (message.Direction)
            {
                case QueryDirection.Request:
                    var receiptId = message.RequestKey;
                    onReceiveMessage(fromClient, message, queryResponse => {
                        var q = new Query();
                        q.Method = message.Method;
                        q.Direction = QueryDirection.Response;
                        q.Type = message.Type;
                        q.AddJson(queryResponse);
                        q.ResponseOptions = message.ResponseOptions;
                        q.To = fromClient.Id;
                        q.RequestKey = receiptId;
                        if (message.Contains("~PoolAllCount~"))
                        {
                            q.Add("~PoolAllCount~", message.Get("~PoolAllCount~"));
                        }
                        server.SendMessage(q);
                    });
                    break;
                case QueryDirection.Response:

                    if (messageResponses.ContainsKey(message.RequestKey))
                    {
                        var callback = messageResponses[message.RequestKey];
                        if (message.ResponseOptions == ResponseOptions.SingleResponse)
                        {
                            if (message.Contains("~PoolAllCount~"))
                            {
                                if (!poolAllCounter.ContainsKey(message.RequestKey))
                                    poolAllCounter[message.RequestKey] = 1;
                                else
                                    poolAllCounter[message.RequestKey] = poolAllCounter[message.RequestKey] + 1;

                                if (poolAllCounter[message.RequestKey] == int.Parse(message.Get("~PoolAllCount~")))
                                {
                                    messageResponses.Remove(message.RequestKey);
                                    poolAllCounter.Remove(message.RequestKey);
                                }
                            }
                            else
                            {
                                messageResponses.Remove(message.RequestKey);
                            }
                        }
                        callback?.Invoke(message);
                    }
                    else
                    {
                        throw new Exception("Cannot find response callback");
                    }
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            } 
        }

        private void onReceiveMessage(Client from, Query query, RespondMessage respond)
        {
            switch (query.Type) {
                case QueryType.Client:
                    onMessage?.Invoke(from, query, respond);
                    return;
                case QueryType.Pool: {
                    var pool = pools.FirstOrDefault(a => a.PoolName == query.To);
                    pool?.ReceiveMessage(from, query, respond);
                    return;
                }
                case QueryType.PoolAll: {
                    var pool = pools.FirstOrDefault(a => a.PoolName == query.To);
                    pool?.ReceiveMessage(from, query, respond);
                }
                    break;
                default: throw new Exception("Type not found: " + query);
            }
        }


        private Client GetClientById(string id)
        {
            var client = clients.FirstOrDefault(a => a.Id == id);
            if (client == null)
            {
                client = new Client(id);
                clients.Add(client);
            }
            return client;
        }

        public void OnReady(Action callback)
        {
            onReady += callback;
        }

        public void OnDisconnect(Action callback)
        {
            onDisconnect += callback;
        }


        public void OnMessage(OnMessage callback)
        {
            onMessage += callback;
        }

        public void GetClientId(Action<string> callback)
        {
            var query = Query.BuildServerRequest("GetClientId");
            sendMessage(query, callback);
        }

        public void GetAllPools(string poolName, Action<GetAllPoolsResponse> callback)
        {
            var query = Query.BuildServerRequest("GetAllPools");

            sendMessage(query, callback);
        }

        public void OnPoolUpdated(string poolName, Action<Client[]> callback)
        {
            var query = Query.BuildServerRequest("OnPoolUpdated", ResponseOptions.OpenResponse);
            query.Add("PoolName", poolName);

            sendMessage<GetClientByPoolResponse>(query,
                response => { callback(response.Clients.Select(a => GetClientById(a.Id)).ToArray()); });
        } 

        public void GetClients(string poolName, Action<Client[]> callback)
        {
            var query = Query.BuildServerRequest("GetClients");
            query.Add("PoolName", poolName);

            sendMessage<GetClientByPoolResponse>(query,
                response => { callback(response.Clients.Select(a => GetClientById(a.Id)).ToArray()); });
        }

        public Pool JoinPool(string poolName)
        {
            var pool = new Pool(poolName);
            this.pools.Add(pool);

            var query = Query.BuildServerRequest("JoinPool");
            query.Add("PoolName", poolName);

            sendMessage<object>(query);
            return pool;
        }

        public void LeavePool(string poolName)
        {
            var query = Query.BuildServerRequest("LeavePool");
            query.Add("PoolName", poolName);
            sendMessage<object>(query, response => { pools.RemoveAll(a => a.PoolName == poolName); });
        }

        public void SendClientMessage<T>(string clientId, string method, object payload, Action<T> callback = null, ResponseOptions responseOptions = ResponseOptions.SingleResponse)
        {
            var query = new Query()
            {
                Method = method,
                Direction = QueryDirection.Request,
                Type = QueryType.Client,
                To = clientId,
                ResponseOptions = responseOptions
            };
            query.AddJson(payload);
            query.Type = QueryType.Client;
            query.To = clientId;
            sendMessage(query, callback);
        }

        public void SendPoolMessage<T>(string poolName, string method, object payload, Action<T> callback = null,
            ResponseOptions responseOptions = ResponseOptions.SingleResponse)
        {
            var query = new Query()
            {
                Method = method,
                Direction = QueryDirection.Request,
                Type = QueryType.Pool,
                To = poolName,
                ResponseOptions = responseOptions
            };
            query.AddJson(payload);
            sendMessage(query, callback);
        }

        public void SendAllPoolMessage<T>(string poolName, string method, object payload, Action<T> callback = null,
            ResponseOptions responseOptions = ResponseOptions.SingleResponse)
        {
            var query = new Query()
            {
                Method = method,
                Direction = QueryDirection.Request,
                Type = QueryType.PoolAll,
                To = poolName,
                ResponseOptions = responseOptions
            };
            query.AddJson(payload);
            sendMessage(query, callback);
        }

        public void Disconnet()
        {
            server.ForceDisconnect();
        }

        internal bool sendMessage<T>(Query query, Action<T> callback = null)
        {
            var responseKey = Guid.NewGuid().ToString("N");
            query.RequestKey = responseKey;
            messageResponses[responseKey] = (payload) => { callback?.Invoke(payload.GetJson<T>()); };

            if (server.Id != null && query.From == null)
                query.From = server.Id;
            return server.SendMessage(query);
        }
    }
}