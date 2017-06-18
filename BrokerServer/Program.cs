using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerServer
{
    class Program
    {
        static void Main(string[] args)
        {

            var threadManager = LocalThreadManager.Start();
            var broker = new ServerBroker();
            threadManager.Process();
        }
    }

    public class ServerBroker : IServerBroker
    {
        private ServerManager serverManager;
        private List<ClientConnection> Swimmers = new List<ClientConnection>();
        private List<ServerPool> Pools { get; set; } = new List<ServerPool>();

        public ServerBroker()
        {
            this.serverManager = new ServerManager(this);
            this.serverManager.StartServer();
        }


        public void AddSwimmer(ClientConnection client)
        {
            this.Swimmers.Add(client);
        }

        public void RemoveSwimmer(ClientConnection client)
        {
            this.Swimmers.Remove(client);
        }

        public GetAllPoolsResponse GetAllPools()
        {
            return new GetAllPoolsResponse()
            {
                PoolNames = Pools.Select(a => a.Name).ToArray()
            };
        }

        public GetPoolByNameResponse GetPoolByName(string poolName)
        {
            var pool = getPoolByName(poolName);

            return new GetPoolByNameResponse()
            {
                PoolName = pool.Name,
                NumberOfSwimmers = pool.Swimmers.Count
            };
        }

        private ServerPool getPoolByName(string poolName)
        {
            ServerPool pool = Pools.FirstOrDefault(a => a.Name == poolName);

            if (pool == null)
            {
                Pools.Add(pool = new ServerPool()
                {
                    Swimmers = new List<ClientConnection>(),
                    Name = poolName
                });
            }
            return pool;
        }

        public void JoinPool(ClientConnection client, string poolName)
        {
            var pool = getPoolByName(poolName);
            if (pool.Swimmers.Contains(client)) return;

            pool.Swimmers.Add(client);
        }

        public GetSwimmerByPoolResponse GetSwimmersInPool(string poolName)
        {
            var pool = getPoolByName(poolName);
            return new GetSwimmerByPoolResponse()
            {
                Swimmers = pool.Swimmers.Select(a => new SwimmerResponse() { Id = a.Id }).ToArray()
            };
        }

        public void SendMessageToSwimmerWithResponse(Query query, Action<Query> respond)
        {
            var swimmer = this.Swimmers.FirstOrDefault(a => a.Id == query.QueryParams["~ToSwimmer~"]);
            swimmer?.SendMessageWithResponse(query, respond);
        }

        public void SendMessageToPoolWithResponse(Query query, Action<Query> respond)
        {
            var poolName = query.QueryParams["~ToPool~"];
            var pool = getPoolByName(poolName);
            var clientConnection = pool.GetRoundRobin();
            var rQuery = new Query(query);
            rQuery.AddQueryParam("~FromSwimmer~", clientConnection.Id);
            clientConnection?.SendMessageWithResponse(rQuery, respond);
        }

        public void SendMessageToPoolAllWithResponse(Query query, Action<Query> respond)
        {
            var poolName = query.QueryParams["~ToPoolAll~"];
            var pool = getPoolByName(poolName);
            foreach (var clientConnection in pool.Swimmers)
            {
                var rQuery = new Query(query);
                rQuery.AddQueryParam("~FromSwimmer~", clientConnection.Id);
                clientConnection.SendMessageWithResponse(rQuery, respond);
            }
        }

        public void SendMessageToSwimmer(Query query)
        {
            var swimmer = this.Swimmers.FirstOrDefault(a => a.Id == query.QueryParams["~ToSwimmer~"]);
            swimmer?.SendMessage(query);
        }

        public void SendMessageToPool(Query query)
        {
            var poolName = query.QueryParams["~ToPool~"];
            var pool = getPoolByName(poolName);
            var clientConnection = pool.GetRoundRobin();
            var rQuery = new Query(query);
            rQuery.AddQueryParam("~FromSwimmer~", clientConnection.Id);
            clientConnection?.SendMessage(rQuery);
        }

        public void SendMessageToPoolAll(Query query)
        {
            var poolName = query.QueryParams["~ToPoolAll~"];
            var pool = getPoolByName(poolName);
            foreach (var clientConnection in pool.Swimmers)
            {
                var rQuery = new Query(query);
                rQuery.AddQueryParam("~FromSwimmer~", clientConnection.Id);
                clientConnection.SendMessage(rQuery);
            }
        }

    }

    public interface IServerBroker
    {
        void AddSwimmer(ClientConnection client);
        void RemoveSwimmer(ClientConnection client);


        GetAllPoolsResponse GetAllPools();
        GetPoolByNameResponse GetPoolByName(string poolName);
        void JoinPool(ClientConnection client, string poolName);
        GetSwimmerByPoolResponse GetSwimmersInPool(string poolName);

        void SendMessageToSwimmerWithResponse(Query query, Action<Query> respond);
        void SendMessageToPoolWithResponse(Query query, Action<Query> respond);
        void SendMessageToPoolAllWithResponse(Query query, Action<Query> respond);

        void SendMessageToSwimmer(Query query);
        void SendMessageToPool(Query query);
        void SendMessageToPoolAll(Query query);
    }


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


    public class ServerManager
    {
        private readonly IServerBroker serverBroker;

        public ServerManager(IServerBroker serverBroker)
        {
            this.serverBroker = serverBroker;
        }

        public void StartServer()
        {

            TcpListener server = null;

            var port = 1987;
            IPAddress localAddr = IPAddress.Parse("127.0.0.1");

            server = new TcpListener(localAddr, port);
            server.Start();

            var connectionListenerThread = new LocalBackgroundWorker<TcpListener, TcpClient>();
            connectionListenerThread.DoWork += Thread_AwaitConnection;
            connectionListenerThread.ReportResponse += (_, client) => NewConnection(client);
            connectionListenerThread.Run(server);
        }

        private void NewConnection(TcpClient tcpClient)
        {
            var client = new ClientConnection(tcpClient);
            client.Start();
            Console.WriteLine("Connected Client " + client.Id);
            this.serverBroker.AddSwimmer(client);
            client.OnDisconnect += ClientDisconnected;
            client.OnMessage += ClientMessage;
            client.OnMessageWithResponse += ClientMessageWithResponse;
        }


        private void ClientMessage(ClientConnection client, Query query)
        {
            if (query.QueryParams.ContainsKey("~ToSwimmer~"))
            {
                this.serverBroker.SendMessageToSwimmer(query);
                return;
            }
            if (query.QueryParams.ContainsKey("~ToPool~"))
            {
                this.serverBroker.SendMessageToPool(query);
                return;
            }
            if (query.QueryParams.ContainsKey("~ToPoolAll~"))
            {
                this.serverBroker.SendMessageToPoolAll(query);
                return;
            }

            throw new Exception("Method not found: " + query.Method);

        }

        private void ClientMessageWithResponse(ClientConnection client, Query query, Action<Query> respond)
        {

            if (query.QueryParams.ContainsKey("~ToSwimmer~"))
            {
                this.serverBroker.SendMessageToSwimmerWithResponse(query, respond);
                return;
            }
            if (query.QueryParams.ContainsKey("~ToPool~"))
            {
                this.serverBroker.SendMessageToPoolWithResponse(query, respond);
                return;
            }
            if (query.QueryParams.ContainsKey("~ToPoolAll~"))
            {
                this.serverBroker.SendMessageToPoolAllWithResponse(query, respond);
                return;
            }


            switch (query.Method)
            {
                case "GetAllPools":
                    {
                        var response = this.serverBroker.GetAllPools();
                        respond(Query.Build(query.Method + "~Response~", response));
                        break;
                    }

                case "GetPool":
                    {
                        var response = this.serverBroker.GetPoolByName(query.QueryParams["PoolName"]);
                        respond(Query.Build(query.Method + "~Response~", response));
                        break;
                    }

                case "JoinPool":
                    {
                        serverBroker.JoinPool(client, query.QueryParams["PoolName"]);
                        respond(Query.Build(query.Method + "~Response~"));
                        break;
                    }

                case "GetSwimmers":
                    {
                        var response = this.serverBroker.GetSwimmersInPool(query.QueryParams["PoolName"]);
                        respond(Query.Build(query.Method + "~Response~", response));
                        break;
                    }
                default: throw new Exception("Method not found: " + query.Method);

            }
        }

        private void Thread_AwaitConnection(LocalBackgroundWorker<TcpListener, TcpClient> worker, TcpListener server)
        {
            try
            {
                while (true)
                {
                    Console.WriteLine("Waiting for a connection... ");
                    TcpClient tcpClient;
                    try
                    {
                        tcpClient = server.AcceptTcpClient();
                        Console.WriteLine("Got connection...");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine(ex);
                        continue;
                    }
                    worker.SendResponse(tcpClient);
                }
            }
            catch (SocketException e)
            {
                Console.WriteLine("SocketException: {0}", e);
            }
            finally
            {
                server?.Stop();
            }
        }



        private void ClientDisconnected(ClientConnection client)
        {
            Console.WriteLine($"Client {client.Id} Disconnected");
            serverBroker.RemoveSwimmer(client);
        }
    }


}
