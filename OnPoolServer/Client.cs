using System;
using OnPoolCommon;

namespace OnPoolServer
{
    public class Client
    {
        public Client(SocketManager socketManager, string clientId)
        {
            SocketManager = socketManager;
            Id = clientId;
        }

        public SocketManager SocketManager { get; }
        public string Id { get; set; }
    }
}