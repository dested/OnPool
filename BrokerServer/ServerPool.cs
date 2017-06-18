using System.Collections.Generic;
using BrokerCommon;

namespace BrokerServer
{
    public class ServerPool
    {
        public string Name { get; set; }
        public List<SocketLayer> Swimmers { get; set; }

        private int roundRobin = 0;
        public SocketLayer GetRoundRobin()
        {
            if (Swimmers.Count == 0)
            {
                return null;
            }
            var swimmer = Swimmers[roundRobin];
            roundRobin = (roundRobin + 1) % Swimmers.Count;
            return swimmer;
        }
    }
}