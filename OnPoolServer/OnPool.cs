using System;
using System.Threading;
using System.Threading.Tasks;
using OnPoolCommon;

namespace OnPoolServer
{
    internal class OnPool
    {
        private static void Main(string[] args)
        {
            var threadManager = LocalThreadManager.Start();
            Task.Run(() =>
            {
                while (true)
                {
                    Thread.Sleep(1000);
                    Console.WriteLine(SocketManager.Counter);
                    SocketManager.Counter = 0;
                }
            });
            var broker = new OnPoolManager();
            threadManager.Process();
            Console.WriteLine("Running..");
            Console.ReadLine();
        }
    }
}