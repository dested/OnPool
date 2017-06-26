using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolClient
{
    public delegate void RespondMessage(object payload);

    public delegate void OnMessage(Client from, Message message, RespondMessage respond);


    public class OnPoolClient
    {
        private SocketManager socketManager;
        private readonly object messageLocker = new object();
        private readonly Dictionary<long, Action<Message>> messageResponses = new Dictionary<long, Action<Message>>();
        private readonly Dictionary<long, int> poolAllCounter = new Dictionary<long, int>();
        private readonly List<Client> clients = new List<Client>();
        private readonly List<Pool> pools = new List<Pool>();

        private Action onReady;
        private Action onDisconnect;
        private OnMessage onMessage;

        public long MyClientId => socketManager.Id;
        public void SetSerializerSettings(JsonSerializerSettings settings)
        {
            JsonExtensions.SetSerializerSettings(settings);
        }

        public void ConnectToServer(string ip)
        {
            socketManager = new SocketManager(ip);
            socketManager.onReceive += (_, message) => messageProcess(message);
            socketManager.OnDisconnect += _ => onDisconnect?.Invoke();
            socketManager.StartFromClient();
            GetClientId(id =>
            {
                socketManager.Id = id;
                onReady?.Invoke();
            });
        }

        private void messageProcess(Message message)
        {
            Client fromClient = GetClientById(message.From != -1 ? message.From : socketManager.Id);

            switch (message.Direction)
            {
                case MessageDirection.Request:
                    var receiptId = message.RequestKey;
                    onReceiveMessage(fromClient, message, messageResponse =>
                    {
                        var q = new Message();
                        q.Method = message.Method;
                        q.Direction = MessageDirection.Response;
                        q.Type = message.Type;
                        q.AddJson(messageResponse);
                        q.ResponseOptions = message.ResponseOptions;
                        q.ToClient = fromClient.Id;
                        q.RequestKey = receiptId;
                        if (message.PoolAllCount != -1)
                        {
                            q.PoolAllCount = message.PoolAllCount;
                        }
                        socketManager.SendMessage(q);
                    });
                    break;
                case MessageDirection.Response:

                    if (messageResponses.ContainsKey(message.RequestKey))
                    {
                        var callback = messageResponses[message.RequestKey];
                        if (message.ResponseOptions == ResponseOptions.SingleResponse)
                        {
                            if (message.PoolAllCount != -1)
                            {
                                lock (messageLocker)
                                {
                                    if (!poolAllCounter.ContainsKey(message.RequestKey))
                                        poolAllCounter[message.RequestKey] = 1;
                                    else
                                        poolAllCounter[message.RequestKey] = poolAllCounter[message.RequestKey] + 1;

                                    if (poolAllCounter[message.RequestKey] == message.PoolAllCount)
                                    {

                                        messageResponses.Remove(message.RequestKey);
                                        poolAllCounter.Remove(message.RequestKey);
                                    }
                                }
                            }
                            else
                            {
                                lock (messageLocker)
                                {
                                    messageResponses.Remove(message.RequestKey);
                                }
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

        private void onReceiveMessage(Client from, Message message, RespondMessage respond)
        {
            switch (message.Type)
            {
                case MessageType.Client:
                    onMessage?.Invoke(from, message, respond);
                    return;
                case MessageType.Pool:
                    {
                        var pool = pools.FirstOrDefault(a => a.PoolName == message.ToPool);
                        pool?.ReceiveMessage(from, message, respond);
                        return;
                    }
                case MessageType.PoolAll:
                    {
                        var pool = pools.FirstOrDefault(a => a.PoolName == message.ToPool);
                        pool?.ReceiveMessage(from, message, respond);
                    }
                    break;
                default: throw new Exception("Type not found: " + message);
            }
        }


        private Client GetClientById(long id)
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

        public void GetClientId(Action<long> callback)
        {
            var message = Message.BuildServerRequest("GetClientId");
            sendMessage(message, callback);
        }

        public void GetAllPools(string poolName, Action<GetAllPoolsResponse> callback)
        {
            var message = Message.BuildServerRequest("GetAllPools");

            sendMessage(message, callback);
        }

        public void OnPoolUpdated(string poolName, Action<Client[]> callback)
        {
            var message = Message.BuildServerRequest("OnPoolUpdated", ResponseOptions.OpenResponse);
            message.AddJson(poolName);

            sendMessage<GetClientByPoolResponse>(message,
                response => { callback(response.Clients.Select(a => GetClientById(a.Id)).ToArray()); });
        }

        public void GetClients(string poolName, Action<Client[]> callback)
        {
            var message = Message.BuildServerRequest("GetClients");
            message.AddJson(poolName);

            sendMessage<GetClientByPoolResponse>(message,
                response => { callback(response.Clients.Select(a => GetClientById(a.Id)).ToArray()); });
        }

        public Pool JoinPool(string poolName)
        {
            var pool = new Pool(poolName);
            this.pools.Add(pool);

            var message = Message.BuildServerRequest("JoinPool");
            message.AddJson(poolName);

            sendMessage<object>(message);
            return pool;
        }

        public void LeavePool(string poolName)
        {
            var message = Message.BuildServerRequest("LeavePool");
            message.AddJson(poolName);
            sendMessage<object>(message, response => { pools.RemoveAll(a => a.PoolName == poolName); });
        }

        public void SendClientMessage<T>(long clientId, string method, object payload = null, Action<T> callback = null, ResponseOptions responseOptions = ResponseOptions.SingleResponse)
        {
            var message = new Message()
            {
                Method = method,
                Direction = MessageDirection.Request,
                Type = MessageType.Client,
                ToClient = clientId,
                ResponseOptions = responseOptions
            };
            message.AddJson(payload);
            sendMessage(message, callback);
        }

        public void SendPoolMessage<T>(string poolName, string method, object payload = null, Action<T> callback = null,
            ResponseOptions responseOptions = ResponseOptions.SingleResponse)
        {
            var message = new Message()
            {
                Method = method,
                Direction = MessageDirection.Request,
                Type = MessageType.Pool,
                ToPool = poolName,
                ResponseOptions = responseOptions
            };
            message.AddJson(payload);
            sendMessage(message, callback);
        }

        public void SendAllPoolMessage<T>(string poolName, string method, object payload = null, Action<T> callback = null,
            ResponseOptions responseOptions = ResponseOptions.SingleResponse)
        {
            var message = new Message()
            {
                Method = method,
                Direction = MessageDirection.Request,
                Type = MessageType.PoolAll,
                ToPool = poolName,
                ResponseOptions = responseOptions
            };
            message.AddJson(payload);
            sendMessage(message, callback);
        }


        public void SendClientMessage(long clientId, string method, object payload = null, ResponseOptions responseOptions = ResponseOptions.SingleResponse)
        {
            this.SendClientMessage<object>(clientId, method, payload, null, responseOptions);
        }

        public void SendPoolMessage(string poolName, string method, object payload = null, ResponseOptions responseOptions = ResponseOptions.SingleResponse)
        {
            this.SendPoolMessage<object>(poolName, method, payload, null, responseOptions);
        }

        public void SendAllPoolMessage(string poolName, string method, object payload = null, ResponseOptions responseOptions = ResponseOptions.SingleResponse)
        {
            this.SendAllPoolMessage<object>(poolName, method, payload, null, responseOptions);
        }

        public void Disconnect()
        {
            socketManager.ForceDisconnect();
        }

        private long messageCounter = 0;
        internal bool sendMessage<T>(Message message, Action<T> callback = null)
        {
            Action<Message> messageResponse = (payload) => { callback?.Invoke(payload.GetJson<T>()); };
            lock (messageLocker)
            {
                var messageRequestKey = this.socketManager.Id + (++messageCounter % SocketManager.counterWidth);
                message.RequestKey = messageRequestKey;
                messageResponses[messageRequestKey] = messageResponse;
            }
            if (socketManager.Id != -1 && message.From == -1)
                message.From = socketManager.Id;
            return socketManager.SendMessage(message);
        }
    }
}