using System;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolClient
{
    public class Pool
    {
        private readonly Func<string, Swimmer> getSwimmer;
        private readonly OnPoolClient client;

        public Pool(OnPoolClient client, string poolName, Func<string, Swimmer> getSwimmer)
        {
            this.client = client;
            this.getSwimmer = getSwimmer;
            PoolName = poolName;
        }

        public string PoolName { get; set; }
        private OnMessage onMessage { get; set; }
        private OnMessageWithResponse onMessageWithResponse { get; set; }


        public void ReceiveMessage(Swimmer from, Query query)
        {
            onMessage?.Invoke(@from, query);
        }
        public void ReceiveMessageWithResponse(Swimmer from, Query query, Action<Query> respond)
        {
            onMessageWithResponse?.Invoke(from, query, respond);
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
            var query = Query.Build("GetSwimmers", new QueryParam("PoolName", PoolName));

            client.sendMessageWithResponse(query, response =>
            {
                callback(
                    response.GetJson<GetSwimmerByPoolResponse>()
                        .Swimmers
                        .Select(a => getSwimmer(a.Id))
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

        public void SendMessage(Query query)
        {
            query.Add("~ToPool~", PoolName);
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

    public class Swimmer
    {
        private readonly OnPoolClient client;

        public Swimmer(OnPoolClient client, string swimmerId)
        {
            this.client = client;
            Id = swimmerId;
        }

        public string Id { get; set; }


        public void SendMessage(Query query)
        {
            query.Add("~ToSwimmer~", Id);
            client.sendMessage(query);
        }

        public void SendMessageWithResponse(Query query, Action<Query> callback)
        {
            query.Add("~ToSwimmer~", Id);
            client.sendMessageWithResponse(query, callback);
        }
    }
}