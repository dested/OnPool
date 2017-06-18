using System.Collections.Generic;
using BrokerCommon;

namespace BrokerServer
{
    public class ServerPool
    {
        public string Name { get; set; }
        public List<ClientConnection> Swimmers { get; set; }

        private int roundRobin = 0;
        public ClientConnection GetRoundRobin()
        {
            if (Swimmers.Count == 0)
            {
                return null;
            }
            roundRobin = (roundRobin + 1) % Swimmers.Count;
            return Swimmers[roundRobin];
        }
    }
}