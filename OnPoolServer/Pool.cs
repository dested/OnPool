using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;
using OnPoolCommon.Models;

namespace OnPoolServer
{
    public class Pool
    {
        private readonly Dictionary<string, Action> onClientChange = new Dictionary<string, Action>();
        private readonly List<Client> clients = new List<Client>();
        private int roundRobin;

        public string Name { get; set; }
        public int NumberOfClients => clients.Count;

        public Pool(string poolName)
        {
            Name = poolName;
        }

        public void AddClient(Client client)
        {
            clients.Add(client);
            foreach (var action in onClientChange.ToArray()) {
                action.Value.Invoke();
            }
        }

        public void RemoveClient(Client client)
        {
            clients.Remove(client);

            onClientChange.Remove(client.Id);
            foreach (var action in onClientChange.ToArray()) {
                action.Value.Invoke();
            }
        }

        public bool ContainsClient(Client client)
        {
            return clients.Contains(client);
        }

        public bool IsEmpty()
        {
            return clients.Count == 0;
        }
      
        public void OnClientChange(Client forClient, Action callback)
        {
            if (onClientChange.ContainsKey(forClient.Id)) {
                onClientChange[forClient.Id] += callback;
            }
            else {
                onClientChange[forClient.Id] = callback;
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