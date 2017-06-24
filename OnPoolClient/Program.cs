﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using OnPoolCommon;

namespace OnPoolClient
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            Thread.Sleep(500);

               Task.Run(() =>
                {
                    while (true)
                    {
                        Thread.Sleep(1000);
                        Console.WriteLine(SocketManager.Counter);
                        SocketManager.Counter = 0;
                    }
                });

            var shouldRunTests = true;
            if (shouldRunTests)
            {
                RunTests();
            }
            else
            {
                var threadManager = LocalThreadManager.Start();
             

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

                var tests = new List<Action<LocalThreadManager>>
                {
                    tc.TestOnPoolUpdatedResponse,
                    tc.TestOnPoolDisconnectedResponse,
                    tc.TestClientResponse,
                    tc.TestPoolResponse,
                    tc.TestDirectClientResponse,
                    tc.TestAllPoolResponse,
//                    tc.TestSlammer

                   /*
                  
                    tc.TestPoolResponse,
                    tc.TestDirectClientResponse,
                    tc.TestAllPoolResponse,
                    tc.TestClientResponse,
                    tc.TestPoolResponse,
                    tc.TestDirectClientResponse,
                    tc.TestAllPoolResponse,
                    tc.TestClientResponse,
                    tc.TestPoolResponse,
                    tc.TestDirectClientResponse,
                    tc.TestAllPoolResponse,
                    tc.TestClientResponse,
                    tc.TestPoolResponse,
                    tc.TestDirectClientResponse,
                    tc.TestAllPoolResponse,
                    tc.TestClientResponse,
                    tc.TestPoolResponse,
                    tc.TestDirectClientResponse,
                    tc.TestAllPoolResponse,
                    tc.TestSlammer*/
                };


                while (true)
                    foreach (var test in tests)
                    {
                        var threadManager = LocalThreadManager.Start();
                        test(threadManager);
                        await threadManager.Process();
                        tc.CleanupTest();
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