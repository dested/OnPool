using System;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerClient
{
    public class BrokerPoolSwimmer
    {
        private BrokerPool brokerPool;
        public string Id { get; set; }

        public BrokerPoolSwimmer(BrokerPool brokerPool, SwimmerResponse a)
        {
            this.brokerPool = brokerPool;
            this.Id = a.Id;
        }


        public void SendMessage(Query query)
        {
            query.Add("~ToSwimmer~", this.Id);
            brokerPool.clientBrokerManager.client.SendMessage(query);
        }
        public void SendMessageWithResponse<T>(Query query, Action<T> callback) where T : class
        {
            query.Add("~ToSwimmer~", this.Id);
            brokerPool.clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<T>());
            });
        }
    }
}