using System;
using System.Net;
using System.Net.Sockets;
using BrokerCommon;

namespace BrokerServer
{
    public class ServerManager
    {
        private readonly Action<ClientConnection> _addClient;
        private readonly Action<ClientConnection> _removeClient;
        private readonly Action<ClientConnection, Query> _clientMessage;
        private readonly Action<ClientConnection, Query, Action<Query>> _clientMessageWithResponse;
        private Socket server;

        public ServerManager(
            Action<ClientConnection> addClient,
            Action<ClientConnection> removeClient,
            Action<ClientConnection, Query> clientMessage,
            Action<ClientConnection, Query, Action<Query>> clientMessageWithResponse
            )
        {
            _addClient = addClient;
            _removeClient = removeClient;
            _clientMessage = clientMessage;
            _clientMessageWithResponse = clientMessageWithResponse;
        }

        public void StartServer()
        {

            var port = 1987;
            server = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            server.Bind(new IPEndPoint(IPAddress.Any, port));
            server.Listen(1000);
            Console.WriteLine("Listening on " + port);
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
            _addClient(client);
            client.OnDisconnect += ClientDisconnected;
            client.OnMessage += _clientMessage;
            client.OnMessageWithResponse += _clientMessageWithResponse;
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
            _removeClient(client);
        }

        public void Disconnect()
        {
            server.Close();
        }
    }
}