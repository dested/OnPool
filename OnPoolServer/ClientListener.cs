using System;
using System.Net;
using System.Net.Sockets;
using OnPoolCommon;

namespace OnPoolServer
{
    public class ClientListener
    {
        private readonly Action<Socket> _newConnection;

        private Socket server;

        public ClientListener(Action<Socket> newConnection)
        {
            _newConnection = newConnection;
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
            connectionListenerThread.ReportResponse += ( client) => _newConnection(client);
            connectionListenerThread.Run(server);
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

         

        public void Disconnect()
        {
            server.Shutdown(SocketShutdown.Both);
            server.Close();
        }
    }
}