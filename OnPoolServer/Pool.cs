using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolServer
{
    public class Pool
    {
        private int roundRobin;
        public string Name { get; set; }
        private List<Client> clients = new List<Client>();

        public Pool(string poolName)
        {
            Name = poolName;
        }
        Dictionary<string, Action> onClientChange = new Dictionary<string, Action>();

        public void OnClientChange(Client forClient, Action callback)
        {
            if (onClientChange.ContainsKey(forClient.Id))
            {
                onClientChange[forClient.Id] += callback;
            }
            else
            {
                onClientChange[forClient.Id] = callback;
            }
        }

        public int NumberOfClients => clients.Count;

        public void AddClient(Client client)
        {
            clients.Add(client);
            foreach (var action in onClientChange)
            {
                action.Value.Invoke();
            }
        }
        public void RemoveClient(Client client)
        {
            clients.Remove(client);

            onClientChange.Remove(client.Id);
            foreach (var action in onClientChange.ToArray())
            {
                action.Value.Invoke();
            }
        }

        public Client GetRoundRobin()
        {
            if (clients.Count == 0)
                return null;
            var client = clients[roundRobin];
            roundRobin = (roundRobin + 1) % clients.Count;
            return client;
        }

        public bool ContainsClient(Client client)
        {
            return clients.Contains(client);
        }


        public bool IsEmpty()
        {
            return clients.Count == 0;
        }

        public ClientResponse[] GetClientsResponse()
        {
            return clients.Select(a => new ClientResponse { Id = a.Id }).ToArray();
        }
        public IEnumerable<SocketManager> GetClientsSockets()
        {
            return clients.Select(a => a.SocketManager);
        }
    }
}