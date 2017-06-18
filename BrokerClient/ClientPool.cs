using System;
using System.Linq;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerClient
{
    public class ClientPool
    {
        internal readonly ClientBrokerManager clientBrokerManager;
        private readonly Func<string, Swimmer> _getSwimmer;
        public string PoolName { get; set; }
        internal OnMessage onMessage { get; set; }
        internal OnMessageWithResponse onMessageWithResponse { get; set; }

        public ClientPool(ClientBrokerManager clientBrokerManager, GetPoolByNameResponse response, Func<string, Swimmer> getSwimmer)
        {
            this.clientBrokerManager = clientBrokerManager;
            _getSwimmer = getSwimmer;
            PoolName = response.PoolName;
        }
        public void OnMessage(OnMessage callback)
        {
            onMessage += callback;
        }

        public void OnMessageWithResponse(OnMessageWithResponse callback)
        {
            onMessageWithResponse += callback;
        }

        public void GetSwimmers(Action<Swimmer[]> callback)
        {
            var query = Query.Build("GetSwimmers", new QueryParam("PoolName", this.PoolName));

            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(
                    response.GetJson<GetSwimmerByPoolResponse>()
                        .Swimmers
                        .Select(a => _getSwimmer(a.Id))
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

        public void SendMessageWithResponse(Query query, Action<Query> callback)
        {
            query.Add("~ToPool~", PoolName);
            clientBrokerManager.client.SendMessageWithResponse(query, callback);
        }

        public void SendAllMessageWithResponse(Query query, Action<Query> callback)
        {
            query.Add("~ToPoolAll~", PoolName);
            clientBrokerManager.client.SendMessageWithResponse(query, callback);
        }
    }
}