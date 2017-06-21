using OnPoolCommon;

namespace OnPoolServer
{
    public class ServerSwimmer
    {
        public ServerSwimmer(SocketLayer socket, string swimmerId)
        {
            Socket = socket;
            Id = swimmerId;
        }

        public SocketLayer Socket { get; }
        public string Id { get; set; }
    }
}