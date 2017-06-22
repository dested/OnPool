using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolClient
{
    public delegate void RespondMessage(params QueryParam[] @params);
    public delegate void OnMessage(Client from, Query message, RespondMessage respond);


    public class OnPoolClient
    {
        private readonly Dictionary<string, Action<Query>> messageResponses = new Dictionary<string, Action<Query>>();
        private readonly Dictionary<string, int> poolAllCounter = new Dictionary<string, int>();
        private readonly List<Pool> pools = new List<Pool>();

        private Action onReady;
        private SocketManager server;
        private readonly List<Client> clients = new List<Client>();
        private Action onDisconnect;
        private OnMessage onMessage;

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

        private void messageProcess(Query message)
        {
//            Console.WriteLine("Get "+ message);


            Client fromClient;
            if (message.From!=null)
                fromClient = getClientById(message.From);
            else
                fromClient = getClientById(server.Id);

            switch (message.Direction)
            {
                case QueryDirection.Request:
                    var receiptId = message.RequestKey; 
                    onReceiveMessage(fromClient, message, queryResponse =>
                        {
                            var q = Query.Build(message.Method, QueryDirection.Response, message.Type, queryResponse);

                            q.To = fromClient.Id;
                            q.RequestKey = receiptId;
                            sendMessage(q, null);
                        }
                    );
                    break;
                case QueryDirection.Response:

                    if (messageResponses.ContainsKey(message.RequestKey))
                    {
                        var callback = messageResponses[message.RequestKey];

                        if (message.Contains("~PoolAllCount~"))
                        {
                            if (!poolAllCounter.ContainsKey(message.RequestKey))
                                poolAllCounter[message.RequestKey] = 1;
                            else
                                poolAllCounter[message.RequestKey] =poolAllCounter[message.RequestKey] + 1;

                            if (poolAllCounter[message.RequestKey] == int.Parse(message["~PoolAllCount~"]))
                            {
                                messageResponses.Remove(message.RequestKey);
                                poolAllCounter.Remove(message.RequestKey);
                            }
                        }
                        else
                        {
                            messageResponses.Remove(message.RequestKey);
                        } 
                        callback(message);
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


        public void OnMessage(OnMessage callback)
        {
            onMessage += callback;
        }
        
        private void onReceiveMessage(Client from, Query query, RespondMessage respond)
        {
            switch (query.Type)
            {
                case QueryType.Client:
                    onMessage?.Invoke(from, query, respond);
                    return;
                case QueryType.Pool:
                {
                    var pool = pools.FirstOrDefault(a => a.PoolName == query.To);
                    pool?.ReceiveMessage(from, query, respond);
                    return;
                }
                case QueryType.PoolAll:
                {
                    var pool = pools.FirstOrDefault(a => a.PoolName == query.To);
                    pool?.ReceiveMessage(from, query, res =>
                    {
                        var ql = res.ToList();
                        ql.Add(new QueryParam("~PoolAllCount~", query["~PoolAllCount~"]));
                        respond(ql.ToArray());
                    });
                }
                    break;
                default:throw new Exception("Type not found: "+query);
            }
        }



        public void GetClientId(Action<string> callback)
        {
            var query = Query.Build("GetClientId", QueryDirection.Request, QueryType.Server);
            sendMessage(query, response => { callback(response.GetJson<string>()); });
        }



        public void SendMessage(string clientId, Query query, Action<Query> callback)
        {
            query.Type = QueryType.Client;
            query.To = clientId;
            sendMessage(query, callback);
        }

        internal bool sendMessage(Query query, Action<Query> callback)
        {
            if (callback != null)
            {
                var responseKey = Guid.NewGuid().ToString("N");
                query.RequestKey = responseKey;
                messageResponses[responseKey] = callback;
            }

            if (server.Id != null && query.From == null)
                query.From = server.Id;
            return server.SendMessage(query);
        }
         

        public void GetAllPools(string poolName, Action<GetAllPoolsResponse> callback)
        {
            var query = Query.Build("GetAllPools", QueryDirection.Request, QueryType.Server);

            sendMessage(query, response => { callback(response.GetJson<GetAllPoolsResponse>()); });
        }

        public void Disconnet()
        {
            server.ForceDisconnect();
        }

        public void GetClients(string poolName,Action<Client[]> callback)
        {
            var query = Query.Build("GetClients", QueryDirection.Request, QueryType.Server, new QueryParam("PoolName", poolName));

            sendMessage(query, response =>
            {
                callback(
                    response.GetJson<GetClientByPoolResponse>()
                        .Clients
                        .Select(a => getClientById(a.Id))
                        .ToArray()
                );
            });
        }

        public void JoinPool(string poolName, OnMessage callback)
        {
            this.pools.Add(new Pool(poolName, callback));
            sendMessage(
                Query.Build("JoinPool", QueryDirection.Request, QueryType.Server, new QueryParam("PoolName", poolName)),
                response =>
                {
                }
            );
        }

        public void SendPoolMessage(string poolName, Query query, Action<Query> callback)
        {
            query.To = poolName;
            query.Type = QueryType.Pool;
            sendMessage(query, callback);
        }

        public void SendAllPoolMessage(string poolName,Query query, Action<Query> callback)
        {
            query.To = poolName;
            query.Type = QueryType.PoolAll;
            sendMessage(query, callback);
        }
    }
}