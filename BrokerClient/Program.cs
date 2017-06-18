using System;
using System.Collections;
using System.ComponentModel;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using BrokerCommon;
using BrokerCommon.Models;
using Newtonsoft.Json;

namespace BrokerClient
{
    class Program
    {
        static void Main(string[] args)
        {
            Thread.Sleep(500);
            var threadManager = LocalThreadManager.Start();
            /*   Task.Run(() =>
               {
                   while (true)
                   {
                       Thread.Sleep(1000);
                       Console.WriteLine(ClientConnection.counter);
                       ClientConnection.counter = 0;
                   }
               });*/
            var c = new ClientBrokerManager();
            c.ConnectToBroker("127.0.0.1");
            c.OnDisconnect(() => { });
            c.OnMessage((from, message) =>
            {
                Console.WriteLine(message.ToString());
            });

            c.OnMessageWithResponse((from, message, respond) =>
            {
                Console.WriteLine(message.ToString());
                respond(Query.Build("Baz", 12));
            });

            c.OnReady(() =>
            {
                c.GetPool("GameServers", pool =>
                {
                    pool.OnMessage((from, message) =>
                   {
                       Console.WriteLine(message.ToString());
                   });
                    pool.OnMessageWithResponse((from, message, respond) =>
                   {
                        //                        Console.WriteLine(message.ToString());
                        respond(Query.Build("Baz", 12));
                   });

                    pool.JoinPool(() =>
                    {
                        pool.SendMessage(Query.Build("CreateGame", new QueryParam("Name", "B")));
                        pool.SendAllMessage(Query.Build("WakeUp"));

                        pool.SendMessageWithResponse<object>(Query.Build("CreateName"), (message) => { });
                        pool.SendAllMessageWithResponse<object>(Query.Build("WakeUp"), (message) => { });
                    });
                });

            });

            threadManager.Process();
        }

    }


}
