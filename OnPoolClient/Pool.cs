using System;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolClient
{
    public class Pool
    {
        private readonly Func<string, Client> getClient;
        private readonly OnPoolClient client;

        public Pool(OnPoolClient client, string poolName, Func<string, Client> getClient)
        {
            this.client = client;
            this.getClient = getClient;
            PoolName = poolName;
        }

        public string PoolName { get; set; }
        private OnMessageWithResponse onMessageWithResponse { get; set; }


      
        public void ReceiveMessageWithResponse(Client from, Query query, Action<Query> respond)
        {
            onMessageWithResponse?.Invoke(from, query, respond);
        }

        public void OnMessageWithResponse(OnMessageWithResponse callback)
        {
            onMessageWithResponse += callback;
        }

        public void GetClients(Action<Client[]> callback)
        {
            var query = Query.Build("GetClients", new QueryParam("PoolName", PoolName));

            client.sendMessageWithResponse(query, response =>
            {
                callback(
                    response.GetJson<GetClientByPoolResponse>()
                        .Clients
                        .Select(a => getClient(a.Id))
                        .ToArray()
                );
            });
        }

        public void JoinPool(Action callback)
        {
            client.sendMessageWithResponse(
                Query.Build("JoinPool", new QueryParam("PoolName", PoolName)),
                response => { callback(); }
            );
        }

        public void SendMessageWithResponse(Query query, Action<Query> callback)
        {
            query.Add("~ToPool~", PoolName);
            client.sendMessageWithResponse(query, callback);
        }

        public void SendAllMessageWithResponse(Query query, Action<Query> callback)
        {
            query.Add("~ToPoolAll~", PoolName);
            client.sendMessageWithResponse(query, callback);
        }
    }

    public class Client
    {
        private readonly OnPoolClient client;

        public Client(OnPoolClient client, string clientId)
        {
            this.client = client;
            Id = clientId;
        }

        public string Id { get; set; }

        public void SendMessageWithResponse(Query query, Action<Query> callback)
        {
            query.Add("~ToClient~", Id);
            client.sendMessageWithResponse(query, callback);
        }
    }
}