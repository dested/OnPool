using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using BrokerCommon;
using BrokerCommon.Models;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;

namespace BrokerClient
{
    class Program
    {
        static void Main(string[] args)
        {
            Thread.Sleep(500);


            var shouldRunTests = true;
            if (shouldRunTests)
            {
                RunTests();
            }
            else
            {



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

                threadManager.Process();

            }


            Console.WriteLine("Running");
            Console.ReadLine();
        }

        public static async Task RunTests()
        {
            var tc = new Tests();

            List<Action<LocalThreadManager>> tests = new List<Action<LocalThreadManager>>();
            tests.Add(tc.TestSwimmerResponse);
            tests.Add(tc.TestPoolResponse);
            tests.Add(tc.TestDirectSwimmerResponse);
            tests.Add(tc.TestAllPoolResponse);
            tests.Add(tc.TestSlammer);



            while (true)
            {
                foreach (var test in tests)
                {
                    var threadManager = LocalThreadManager.Start();
                    test(threadManager);
                    await threadManager.Process();
                    Console.WriteLine("Test passed");
                    foreach (var clientBrokerManager in tc.clients)
                    {
                        clientBrokerManager.Disconnet();
                    }
                    tc.clients = new List<ClientBrokerManager>();
                }

            }

            Console.WriteLine("Done");


        }
    }


}
