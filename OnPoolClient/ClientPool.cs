using System;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolClient
{
    public class ClientPool
    {
        internal readonly ClientBrokerManager client;
        private readonly Func<string, ClientSwimmer> _getSwimmer;
        public string PoolName { get; set; }
        internal OnMessage onMessage { get; set; }
        internal OnMessageWithResponse onMessageWithResponse { get; set; }

        public ClientPool(ClientBrokerManager client, string poolName, Func<string, ClientSwimmer> getSwimmer)
        {
            this.client = client;
            _getSwimmer = getSwimmer;
            PoolName = poolName;
        }
        public void OnMessage(OnMessage callback)
        {
            onMessage += callback;
        }

        public void OnMessageWithResponse(OnMessageWithResponse callback)
        {
            onMessageWithResponse += callback;
        }

        public void GetSwimmers(Action<ClientSwimmer[]> callback)
        {
            var query = Query.Build("GetSwimmers", new QueryParam("PoolName", this.PoolName));

            client.sendMessageWithResponse(query, (response) =>
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
            client.sendMessageWithResponse(
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
            client.sendMessage(query);
        }

        public void SendAllMessage(Query query)
        {
            query.Add("~ToPoolAll~", PoolName);
            client.sendMessage(query);
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
    public class ClientSwimmer
    {
        private ClientBrokerManager client;
        public string Id { get; set; }

        public ClientSwimmer(ClientBrokerManager client, string swimmerId)
        {
            this.client = client;
            this.Id = swimmerId;
        }



        public void SendMessage(Query query)
        {
            query.Add("~ToSwimmer~", this.Id);
            this.client.sendMessage(query);
        }

        public void SendMessageWithResponse(Query query, Action<Query> callback)
        {
            query.Add("~ToSwimmer~", this.Id);
            this.client.sendMessageWithResponse(query, callback);
        }
    }

}