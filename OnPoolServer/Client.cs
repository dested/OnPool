using System;
using OnPoolCommon;

namespace OnPoolServer
{
    public class Client
    {
        public SocketManager SocketManager { get; }
        public long Id { get; set; }

        public Client(SocketManager socketManager, long clientId)
        {
            SocketManager = socketManager;
            Id = clientId;
        }
    }
}