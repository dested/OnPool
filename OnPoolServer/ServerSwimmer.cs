using OnPoolCommon;

namespace OnPoolServer
{
    public class ServerSwimmer
    {
        public SocketLayer Socket { get; }
        public string Id { get; set; }

        public ServerSwimmer(SocketLayer socket, string swimmerId)
        {
            this.Socket = socket;
            this.Id = swimmerId;
        }


    }
}