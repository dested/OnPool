using System;
using System.Net;
using System.Net.Sockets;
using BrokerCommon;

namespace BrokerServer
{
    public class ServerManager
    {
        private readonly IServerBroker serverBroker;
        private Socket server;

        public ServerManager(IServerBroker serverBroker)
        {
            this.serverBroker = serverBroker;
        }

        public void StartServer()
        {

            var port = 1987; 
            server = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            server.Bind(new IPEndPoint(IPAddress.Any, port));
            server.Listen(1000);
            Console.WriteLine("Listening on "+port);
            var connectionListenerThread = new LocalBackgroundWorker<Socket, Socket>();
            connectionListenerThread.DoWork += Thread_AwaitConnection;
            connectionListenerThread.ReportResponse += (_, client) => NewConnection(client);
            connectionListenerThread.Run(server);
        }

        private void NewConnection(Socket socket)
        {
            var client = new ClientConnection(socket);
            client.Start();
            Console.WriteLine("Connected Client " + client.Id);
            this.serverBroker.AddSwimmer(client);
            client.OnDisconnect += ClientDisconnected;
            client.OnMessage += ClientMessage;
            client.OnMessageWithResponse += ClientMessageWithResponse;
        }


        private void ClientMessage(ClientConnection client, Query query)
        {
            if (query.Contains("~ToSwimmer~"))
            {
                this.serverBroker.SendMessageToSwimmer(query);
                return;
            }
            if (query.Contains("~ToPool~"))
            {
                this.serverBroker.SendMessageToPool(query);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                this.serverBroker.SendMessageToPoolAll(query);
                return;
            }

            throw new Exception("Method not found: " + query.Method);

        }

        private void ClientMessageWithResponse(ClientConnection client, Query query, Action<Query> respond)
        {
            if (query.Contains("~ToSwimmer~"))
            {
                this.serverBroker.SendMessageToSwimmerWithResponse(query, respond);
                return;
            }
            if (query.Contains("~ToPool~"))
            {
                this.serverBroker.SendMessageToPoolWithResponse(query, respond);
                return;
            }
            if (query.Contains("~ToPoolAll~"))
            {
                this.serverBroker.SendMessageToPoolAllWithResponse(query, respond);
                return;
            }


            switch (query.Method)
            {
                case "GetSwimmerId":
                    {
                        respond(Query.Build(query.Method, client.Id));
                        break;
                    }
                case "GetAllPools":
                    {
                        var response = this.serverBroker.GetAllPools();
                        respond(Query.Build(query.Method, response));
                        break;
                    }

                case "GetPool":
                    {
                        var response = this.serverBroker.GetPoolByName(query["PoolName"]);
                        respond(Query.Build(query.Method, response));
                        break;
                    }

                case "JoinPool":
                    {
                        serverBroker.JoinPool(client, query["PoolName"]);
                        respond(Query.Build(query.Method));
                        break;
                    }

                case "GetSwimmers":
                    {
                        var response = this.serverBroker.GetSwimmersInPool(query["PoolName"]);
                        respond(Query.Build(query.Method, response));
                        break;
                    }
                default: throw new Exception("Method not found: " + query.Method);

            }
        }

        private void Thread_AwaitConnection(LocalBackgroundWorker<Socket, Socket> worker, Socket server)
        {
            try
            {
                while (true)
                {
                    Socket socket;
                    try
                    {
                        socket = server.Accept();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine(ex);
                        continue;
                    }
                    worker.SendResponse(socket);
                }
            }
            catch (SocketException e)
            {
                Console.WriteLine("SocketException: {0}", e);
            }
            finally
            {
                server?.Close();
            }
        }



        private void ClientDisconnected(ClientConnection client)
        {
            Console.WriteLine($"Client {client.Id} Disconnected");
            serverBroker.RemoveSwimmer(client);
        }

        public void Disconnect()
        {
            server.Close();
        }
    }
}