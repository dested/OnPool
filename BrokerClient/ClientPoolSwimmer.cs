using System;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerClient
{
    public class ClientPoolSwimmer
    {
        private ClientPool clientPool;
        public string Id { get; set; }

        public ClientPoolSwimmer(ClientPool clientPool, SwimmerResponse a)
        {
            this.clientPool = clientPool;
            this.Id = a.Id;
        }


        public void SendMessage(Query query)
        {
            query.Add("~ToSwimmer~", this.Id);
            clientPool.clientBrokerManager.client.SendMessage(query);
        }

        public void SendMessageWithResponse<T>(Query query, Action<T> callback) where T : class
        {
            query.Add("~ToSwimmer~", this.Id);
            clientPool.clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<T>());
            });
        }
    }
}