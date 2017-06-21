using System.Collections.Generic;

namespace OnPoolServer
{
    public class Pool
    {
        private int roundRobin;
        public string Name { get; set; }
        public List<Client> Clients { get; set; }

        public Client GetRoundRobin()
        {
            if (Clients.Count == 0)
                return null;
            var client = Clients[roundRobin];
            roundRobin = (roundRobin + 1) % Clients.Count;
            return client;
        }
    }
}