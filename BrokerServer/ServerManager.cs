using System;
using System.Net;
using System.Net.Sockets;
using BrokerCommon;

namespace BrokerServer
{
    public class ServerManager
    {
        private readonly Action<SocketLayer> _addClient;
        private readonly Action<SocketLayer> _removeClient;
        private readonly Func<string, Swimmer> _getSwimmer;
        private readonly OnMessage _clientMessage;
        private readonly OnMessageWithResponse _clientMessageWithResponse;
        private Socket server;

        public ServerManager(
            Action<SocketLayer> addClient,
            Action<SocketLayer> removeClient,
            Func<string,Swimmer> getSwimmer,
            OnMessage clientMessage,
            OnMessageWithResponse clientMessageWithResponse
            )
        {
            _addClient = addClient;
            _removeClient = removeClient;
            _getSwimmer = getSwimmer;
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
            connectionListenerThread.ReportResponse += ( client) => NewConnection(client);
            connectionListenerThread.Run(server);
        }

        private void NewConnection(Socket socket)
        {
            var client = new SocketLayer(socket, _getSwimmer);
            client.Start();
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



        private void ClientDisconnected(SocketLayer client)
        { 
            _removeClient(client);
        }

        public void Disconnect()
        {
            server.Shutdown(SocketShutdown.Both);
            server.Close();
        }
    }
}