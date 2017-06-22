using System;
using System.Linq;
using System.Security.Authentication.ExtendedProtection;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolClient
{
    public class Pool
    {

        public Pool( string poolName, OnMessage onMessage)
        {
            this.onMessage = onMessage;
            PoolName = poolName;
        }

        public string PoolName { get; set; }
        private OnMessage onMessage { get; set; }

        public void ReceiveMessage(Client from, Query query, RespondMessage respond)
        {
            onMessage?.Invoke(from, query, respond);
        }

        public void OnMessage(OnMessage callback)
        {
            onMessage += callback;
        }

    }

    public class Client
    {
        private readonly OnPoolClient poolClient;

        public Client(OnPoolClient poolClient, string clientId)
        {
            this.poolClient = poolClient;
            Id = clientId;
        }

        public string Id { get; set; }

        public void SendMessage(Query query, Action<Query> callback)
        {
            query.Type = QueryType.Client;
            query.To = Id;
            poolClient.sendMessage(query, callback);
        }
    }
}