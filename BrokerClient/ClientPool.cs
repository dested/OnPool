using System;
using System.Linq;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerClient
{
    public class ClientPool
    {
        internal readonly ClientBrokerManager clientBrokerManager;
        public string PoolName { get; set; }
        internal Action<Query> onMessage { get; set; }
        internal Action<Query, Action<Query>> onMessageWithResponse { get; set; }
        public void OnMessage(Action<Query> callback)
        {
            onMessage += callback;
        }

        public void OnMessageWithResponse(Action<Query, Action<Query>> callback)
        {
            onMessageWithResponse += callback;
        }

        public ClientPool(ClientBrokerManager clientBrokerManager, GetPoolByNameResponse response)
        {
            this.clientBrokerManager = clientBrokerManager;
            PoolName = response.PoolName;
        }

        public void GetSwimmers(Action<ClientPoolSwimmer[]> callback)
        {
            var query = Query.Build("GetSwimmers", new QueryParam("PoolName", this.PoolName));

            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(
                    response.GetJson<GetSwimmerByPoolResponse>()
                        .Swimmers
                        .Select(a => new ClientPoolSwimmer(this, a))
                        .ToArray()
                );
            });

        }

        public void JoinPool(Action callback)
        {
            clientBrokerManager.client.SendMessageWithResponse(
                Query.Build("JoinPool", new QueryParam("PoolName", this.PoolName)),
                (response) =>
                {
                    callback();
                }
            );
        }

        public void SendMessage(Query query)
        {
            query.Add("~ToPool~", this.PoolName);
            clientBrokerManager.client.SendMessage(query);
        }

        public void SendAllMessage(Query query)
        {
            query.Add("~ToPoolAll~", PoolName);
            clientBrokerManager.client.SendMessage(query);
        }

        public void SendMessageWithResponse<T>(Query query, Action<T> callback)
        {
            query.Add("~ToPool~", PoolName);
            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<T>());
            });
        }

        public void SendAllMessageWithResponse<T>(Query query, Action<T> callback)
        {
            query.Add("~ToPoolAll~", PoolName);
            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<T>());
            });
        }
    }
}