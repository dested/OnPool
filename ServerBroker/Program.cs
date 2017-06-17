using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using BrokerCommon;

namespace BrokerServer
{
    class Program
    {
        static void Main(string[] args)
        {

            var threadManager = LocalThreadManager.Start();
            var broker = new ServerBroker();
            broker.StartServer();
            threadManager.Process();
        }
    }


    public class ServerBroker
    {
        public List<ClientConnection> Clients = new List<ClientConnection>();

        public void StartServer()
        {

            TcpListener server = null;

            var port = 1987;
            IPAddress localAddr = IPAddress.Parse("127.0.0.1");

            server = new TcpListener(localAddr, port);
            server.Start();

            var connectionListenerThread = new LocalBackgroundWorker<TcpListener, TcpClient>();
            connectionListenerThread.DoWork += Thread_AwaitConnection;
            connectionListenerThread.ProgressChanged += (_, client) => NewConnection(client);
            connectionListenerThread.Run(server);

        }

        private void NewConnection(TcpClient tcpClient)
        {
            var client = new ClientConnection(tcpClient);
            client.Start();
            Console.WriteLine("Connected Client " + client.Id);
            Clients.Add(client);
            client.OnDisconnect += ClientDisconnected;
            client.OnMessage += ClientMessage;
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


        private void ClientMessage(ClientConnection client, string message)
        {
            //            Console.WriteLine($"Client {client.Id} Message: {message}");
            if (int.Parse(message) % 100 == 0)
            {
                Console.WriteLine(message);
            }
            client.SendMessage((int.Parse(message) + 1).ToString());

        }

        private void ClientDisconnected(ClientConnection client)
        {
            Console.WriteLine($"Client {client.Id} Disconnected");

            Clients.Remove(client);
        }
    }


}
