using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using OnPoolCommon;

namespace OnPoolClientTester
{
    class Program
    {
        private static void Main(string[] args)
        {
            Thread.Sleep(500);

            Task.Run(() => {
                while (true) {
                    Thread.Sleep(1000);
                    Console.WriteLine(SocketManager.Counter);
                    SocketManager.Counter = 0;
                }
            });

                RunTests();

            Console.WriteLine("Running");
            Console.ReadLine();
        }

        public static async Task RunTests()
        {
            try {
                var tc = new Tests();

                var tests = new List<Action<Action>>();

                for (int i = 0; i < 10; i++) {
                    tests.AddRange(new Action<Action>[]
                    {
                        tc.TestEveryone,
                        tc.TestLeavePool,
                        tc.TestOnPoolUpdatedResponse,
                        tc.TestOnPoolDisconnectedResponse,
                        tc.TestClientResponse,
                        tc.TestPoolResponse,
                        tc.TestDirectClientResponse,
                        tc.TestAllPoolResponse,
                        tc.TestClientSendObject
                    });
                }
                tests.Add(tc.TestSlammer);

                while (true)
                    foreach (var test in tests) {
                        var threadManager = LocalThreadManager.Start();
                        test(() => {
                            threadManager.Kill();
                        });
                        await threadManager.Process();
                        tc.CleanupTest();
                        Console.WriteLine("Test Pass");
                    }
            }
            catch (Exception ex) {
                Console.WriteLine(ex);
            }
            Console.WriteLine("Done");
        }

    }
}
