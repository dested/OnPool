using OnPoolCommon;

namespace OnPoolServer
{
    public class ServerSwimmer
    {
        public ServerSwimmer(SocketManager socketManager, string swimmerId)
        {
            SocketManager = socketManager;
            Id = swimmerId;
        }

        public SocketManager SocketManager { get; }
        public string Id { get; set; }
    }
}