using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using OnPoolCommon;

namespace OnPoolClient
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
            try
            {
                var tc = new Tests();

                List<Action<LocalThreadManager>> tests = new List<Action<LocalThreadManager>>();
//                tests.Add(tc.TestSwimmerResponse);
//                tests.Add(tc.TestPoolResponse);
//                tests.Add(tc.TestDirectSwimmerResponse);
//                tests.Add(tc.TestAllPoolResponse);
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

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
            Console.WriteLine("Done");


        }
    }


}
