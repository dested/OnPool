using System;
using System.Linq;
using System.Security.Authentication.ExtendedProtection;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolClient
{
    public class Pool
    {
        private OnMessage onMessage { get; set; }
        public string PoolName { get; set; }

        public Pool(string poolName)
        {
            PoolName = poolName;
        }

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
        public string Id { get; set; }

        public Client(string clientId)
        {
            Id = clientId;
        }
    }
}