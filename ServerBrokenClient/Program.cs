using System;
using System.ComponentModel;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using BrokerCommon;

namespace BrokerClient
{
    class Program
    {
        static void Main(string[] args)
        {
            Thread.Sleep(500);
            var threadManager = LocalThreadManager.Start();

            var client = new ClientConnection("127.0.0.1");
            client.OnMessage += OnMessage;
            client.OnDisconnect += OnDisconnect;
            client.StartFromClient();
            client.SendMessage("0");
            threadManager.Process();

        }

        private static void OnDisconnect(ClientConnection client)
        {
            Console.WriteLine("Disconnected from server");
        } 

        private static void OnMessage(ClientConnection client, string message)
        { 
            if (int.Parse(message) % 100 == 0)
            {
                Console.WriteLine(message);
            }
            client.SendMessage((int.Parse(message)+1).ToString());
            //            Console.WriteLine($"Message From Server {message}");
        }
    }

  
}
