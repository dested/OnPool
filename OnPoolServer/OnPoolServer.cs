using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolServer
{
    public class OnPoolServer
    {
        private readonly List<Client> clients = new List<Client>();
        private readonly List<Pool> pools = new List<Pool>();
        private readonly ClientListener serverManager;

        private readonly Dictionary<long, Dictionary<long, Action<Message>>> messageResponses = new Dictionary<long, Dictionary<long, Action<Message>>>();
        private readonly Dictionary<long, Dictionary<long, int>> poolAllCounter = new Dictionary<long, Dictionary<long, int>>();

        public OnPoolServer()
        {
            var threadManager = LocalThreadManager.Start();
            serverManager = new ClientListener(socket =>
            {
                var socketManager = new SocketManager(socket);
                socketManager.onReceive += onMessage;
                socketManager.OnDisconnect += RemoveClient;
                AddClient(socketManager);
                socketManager.Start();
            }
            );
            serverManager.StartServer();
            threadManager.Process();
        }

        private void onMessage(SocketManager socketManager, Message message)
        {
            Client fromClient = GetClient(socketManager.Id);

            switch (message.Direction)
            {
                case MessageDirection.Request:

                    var receiptId = message.RequestKey;
                    ClientMessage(fromClient, message, messageResponse =>
                    {
                        var q = new Message();
                        q.Method = message.Method;
                        q.Direction = MessageDirection.Response;
                        q.Type = message.Type;
                        q.ResponseOptions = message.ResponseOptions;
                        q.ToClient = fromClient.Id;
                        q.RequestKey = receiptId;
                        if (message.PoolAllCount > -1)
                        {
                            q.PoolAllCount = message.PoolAllCount;
                        }
                        q.AddJson(messageResponse);
                        socketManager.SendMessage(q);
                    }
                    );

                    break;
                case MessageDirection.Response:
                    var clientMessageResponses = ClientMessageResponses(socketManager.Id);
                    if (clientMessageResponses.ContainsKey(message.RequestKey))
                    {
                        var callback = clientMessageResponses[message.RequestKey];
                        if (message.ResponseOptions == ResponseOptions.SingleResponse)
                        {
                            if (message.PoolAllCount > -1)
                            {
                                var clientPoolAllCount = ClientPoolAllCount(socketManager.Id);

                                if (!clientPoolAllCount.ContainsKey(message.RequestKey))
                                    clientPoolAllCount[message.RequestKey] = 1;
                                else
                                    clientPoolAllCount[message.RequestKey] = clientPoolAllCount[message.RequestKey] + 1;

                                if (clientPoolAllCount[message.RequestKey] == message.PoolAllCount)
                                {
                                    clientMessageResponses.Remove(message.RequestKey);
                                    clientPoolAllCount.Remove(message.RequestKey);
                                }
                            }
                            else
                            {
                                clientMessageResponses.Remove(message.RequestKey);
                            }
                        }
                        callback?.Invoke(message);
                    }
                    else
                    {
                        throw new Exception("Cannot find response callback  " + message);
                    }

                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }

        private Dictionary<long, Action<Message>> ClientMessageResponses(long id)
        {
            Dictionary<long, Action<Message>> result;
            if (!messageResponses.TryGetValue(id, out result))
            {
                messageResponses[id] = result = new Dictionary<long, Action<Message>>();
            }
            return result;
        }
        private Dictionary<long, int> ClientPoolAllCount(long id)
        {
            Dictionary<long, int> result;
            if (!poolAllCounter.TryGetValue(id, out result))
            {
                poolAllCounter[id] = result = new Dictionary<long, int>();
            }
            return result;
        }

        private void ClientMessage(Client client, Message message, Action<object> respond)
        {
            switch (message.Type)
            {
                case MessageType.Client:
                    ForwardMessageToClient(message, respond);
                    break;
                case MessageType.Pool:
                    ForwardMessageToPool(message, respond);
                    break;
                case MessageType.PoolAll:
                    ForwardMessageToPoolAll(message, respond);
                    break;
                case MessageType.Server:
                    switch (message.Method)
                    {
                        case "GetClientId":
                            {
                                respond(client.Id);
                                break;
                            }
                        case "GetAllPools":
                            {
                                respond(new GetAllPoolsResponse
                                {
                                    PoolNames = pools.Select(a => a.Name).ToArray()
                                });
                                break;
                            }
                        case "OnPoolUpdated":
                            {
                                var poolName = message.GetJson<string>();
                                var pool = getPoolByName(poolName);
                                pool.OnClientChange(client, () => { respond(GetClientByPool(poolName)); });
                                respond(GetClientByPool(poolName));

                                break;
                            }
                        case "JoinPool":
                            {
                                var poolName = message.GetJson<string>();
                                JoinPool(client, poolName);
                                respond(null);
                                break;
                            }
                        case "LeavePool":
                            {
                                var poolName = message.GetJson<string>();
                                var pool = getPoolByName(poolName);
                                if (pool.ContainsClient(client))
                                {
                                    pool.RemoveClient(client);
                                    if (pool.IsEmpty())
                                    {
                                        pools.Remove(pool);
                                    }
                                }
                                respond(null);
                                break;
                            }
                        case "GetClients":
                            {
                                var poolName = message.GetJson<string>();
                                respond(GetClientByPool(poolName));
                                break;
                            }
                        default: throw new Exception("Method not found: " + message.Method);
                    }
                    break;
                default:
                    throw new Exception("Type not found " + message);
            }
        }

        private GetClientByPoolResponse GetClientByPool(string poolName)
        {
            return new GetClientByPoolResponse
            {
                Clients = getPoolByName(poolName).GetClientsResponse()
            };
        }

        public Client GetClient(long id)
        {
            return clients.FirstOrDefault(a => a.Id == id);
        }

        public void AddClient(SocketManager socketManager)
        {
            var client = new Client(socketManager, socketManager.Id);
            clients.Add(client);
            JoinPool(client, "Everyone");
        }

        public void RemoveClient(SocketManager socketManager)
        {
            var client = clients.First(a => a.Id == socketManager.Id);
            clients.Remove(client);
            messageResponses.Remove(client.Id);
            poolAllCounter.Remove(client.Id);

            for (var index = pools.Count - 1; index >= 0; index--)
            {
                var serverPool = pools[index];
                if (serverPool.ContainsClient(client))
                {
                    serverPool.RemoveClient(client);
                    if (serverPool.IsEmpty())
                    {
                        pools.Remove(serverPool);
                    }
                }
            }
        }

        public void JoinPool(Client client, string poolName)
        {
            var pool = getPoolByName(poolName);
            if (pool.ContainsClient(client))
            {
                return;
            }
            pool.AddClient(client);
        }

        public bool FowardMessage(SocketManager socketManager, Message message, Action<Message> callback)
        {
            if (socketManager == null)
            {
                throw new Exception("socket not found " + message);
            }

            var responseKey = message.RequestKey;
            ClientMessageResponses(socketManager.Id)[responseKey] = callback;

            if (message.From == -1)
                message.From = socketManager.Id;

            return socketManager.SendMessage(message);
        }

        public void ForwardMessageToClient(Message message, Action<object> respond)
        {
            var client = clients.FirstOrDefault(a => a.Id == message.ToClient);
            FowardMessage(client?.SocketManager, message, (q) => { respond(q.GetJson<object>()); });
        }

        public void ForwardMessageToPool(Message message, Action<object> respond)
        {
            var poolName = message.ToPool;
            var pool = getPoolByName(poolName);
            var client = pool.GetRoundRobin();
            if (client == null)
            {
                Console.WriteLine("No round robin found " + message);
                //todo idk, maybe tell the caller theres no round robin
                return;
            }
            FowardMessage(client.SocketManager, message, (q) => { respond(q.GetJson<object>()); });
        }

        public void ForwardMessageToPoolAll(Message message, Action<object> respond)
        {
            var poolName = message.ToPool;
            var pool = getPoolByName(poolName);
            var count = pool.NumberOfClients;

            message.PoolAllCount = count;

            foreach (var socket in pool.GetClientsSockets())
            {
                FowardMessage(socket, message, (q) => { respond(q.GetJson<object>()); });
            }
        }

        public bool SendMessage(SocketManager socketManager, Message message, Action<Message> callback)
        {
            ClientMessageResponses(socketManager.Id)[message.RequestKey] = callback;

            if (message.From == -1)
                message.From = socketManager.Id;
            return socketManager.SendMessage(message);
        }

        public void Disconnect()
        {
            serverManager.Disconnect();
        }

        private Pool getPoolByName(string poolName)
        {
            var pool = pools.FirstOrDefault(a => a.Name == poolName);

            if (pool == null)
                pools.Add(pool = new Pool(poolName));
            return pool;
        }
    }
}