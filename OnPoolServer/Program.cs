using System;
using System.Threading;
using System.Threading.Tasks;
using OnPoolCommon;

namespace OnPoolServer
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            Task.Run(() =>
            {
                while (true)
                {
                    Thread.Sleep(1000);
                    Console.WriteLine(SocketManager.Counter);
                    SocketManager.Counter = 0;
                }
            });
            var broker = new OnPoolServer();
            Console.WriteLine("Running..");
            Console.ReadLine();
        }
    }
}