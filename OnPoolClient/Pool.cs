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

        public void ReceiveMessage(Client from, Message message, RespondMessage respond)
        {
            onMessage?.Invoke(from, message, respond);
        }

        public void OnMessage(OnMessage callback)
        {
            onMessage += callback;
        }
    }

    public class Client
    {
        public long Id { get; set; }

        public Client(long clientId)
        {
            Id = clientId;
        }
    }
}