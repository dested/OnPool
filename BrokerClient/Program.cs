using System;
using System.Collections;
using System.ComponentModel;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;
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

            var c = new ClientBrokerManager();
            c.ConnectToBroker("127.0.0.1");
            c.OnDisconnect += () => { };
            c.OnMessage += (message) =>
            {
                Console.WriteLine(message.ToString());
            };
            c.OnMessageWithResponse += (message, respond) =>
            {
                Console.WriteLine(message.ToString());
                respond(Query.Build("Baz", 12));
            };

            c.OnReady += () =>
            {
                c.GetPool("GameServers", pool =>
                {
                    pool.OnMessage += (message) =>
                    {
                        Console.WriteLine(message.ToString());
                    };
                    pool.OnMessageWithResponse += (message, respond) =>
                    {
                        Console.WriteLine(message.ToString());
                        respond(Query.Build("Baz", 12));
                    };

                    pool.JoinPool(() =>
                    {
                        /*
                                                pool.GetSwimmers(swimmers =>
                                                {
                                                    foreach (var swimmer in swimmers)
                                                    {

                                                        Console.WriteLine(swimmer.Id);
                                                        swimmer.SendMessage(Query.Build("Foo"));
                                                        swimmer.SendMessageWithResponse<object>(Query.Build("Bar"), (message) => { });
                                                    }
                                                });
                        */
                        pool.SendMessage(Query.Build("CreateGame", new QueryParam("Name", "B")));
                        pool.SendAllMessage(Query.Build("WakeUp"));
                        pool.SendMessageWithResponse<object>(Query.Build("CreateName"), (message) => { });
                        pool.SendAllMessageWithResponse<object>(Query.Build("WakeUp"), (message) => { });
                    });
                });

            };

            threadManager.Process();
        }

    }


}
