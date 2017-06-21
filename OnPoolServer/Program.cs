using System;
using System.Threading;
using System.Threading.Tasks;
using OnPoolCommon;

namespace OnPoolServer
{
    class Program
    {
        static void Main(string[] args)
        {

            var threadManager = LocalThreadManager.Start();
            var broker = new ServerBroker();
            Task.Run(() =>
            {
                while (true)
                {
                    Thread.Sleep(1000);
                    Console.WriteLine(SocketLayer.counter);
                    SocketLayer.counter = 0;
                }
            });
            threadManager.Process();
            Console.WriteLine("Running..");
            Console.ReadLine();
        }
    }
}
