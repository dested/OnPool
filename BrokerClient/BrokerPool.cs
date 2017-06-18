using System;
using System.Linq;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerClient
{
    public class BrokerPool
    {
        internal readonly ClientBrokerManager clientBrokerManager;
        private bool joinedPool = false;
        public string PoolName { get; set; }
        public int NumberOfSwimmers { get; set; }
        public Action<Query> onMessage { get; set; }
        public Action<Query,Action<Query>> onMessageWithResponse { get; set; }
        public void OnMessage(Action<Query> callback)
        {
            onMessage += callback;
        }
        public void OnMessageWithResponse(Action<Query, Action<Query>> callback)
        {
            onMessageWithResponse += callback;
        }
        public BrokerPool(ClientBrokerManager clientBrokerManager, GetPoolByNameResponse response)
        {
            this.clientBrokerManager = clientBrokerManager;
            this.PoolName = response.PoolName;
            this.NumberOfSwimmers = response.NumberOfSwimmers;
        }

        public void GetSwimmers(GetSwimmersCallback callback)
        {
            var query = Query.Build("GetSwimmers", new QueryParam("PoolName", this.PoolName));

            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(
                    response.GetJson<GetSwimmerByPoolResponse>()
                        .Swimmers
                        .Select(a => new BrokerPoolSwimmer(this, a))
                        .ToArray()
                );
            });

        }

        public void JoinPool(JoinPoolCallback callback)
        {
            var query = Query.Build("JoinPool", new QueryParam("PoolName", this.PoolName));

            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                this.joinedPool = true;
                callback();
            });
        }

        public void SendMessage(Query query)
        {
            query.Add("~ToPool~", this.PoolName);
            clientBrokerManager.client.SendMessage(query);
        }
        public void SendAllMessage(Query query)
        {
            query.Add("~ToPoolAll~", this.PoolName);
            clientBrokerManager.client.SendMessage(query);
        }

        public void SendMessageWithResponse<T>(Query query, Action<T> callback) 
        {
            query.Add("~ToPool~", this.PoolName);
            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<T>());
            });
        }
        public void SendAllMessageWithResponse<T>(Query query, Action<T> callback) 
        {
            query.Add("~ToPoolAll~", this.PoolName);
            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<T>());
            });
        }
    }
}