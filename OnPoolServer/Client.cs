using System;
using OnPoolCommon;

namespace OnPoolServer
{
    public class Client
    {
        public SocketManager SocketManager { get; }
        public string Id { get; set; }

        public Client(SocketManager socketManager, string clientId)
        {
            SocketManager = socketManager;
            Id = clientId;
        }
    }
}