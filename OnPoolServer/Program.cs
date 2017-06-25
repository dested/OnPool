using System;
using System.Threading;
using System.Threading.Tasks;
using OnPoolCommon;
using System.Linq;

namespace OnPoolServer
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            Task.Run(() => {
                while (true) {
                    Thread.Sleep(1000);
                    Console.WriteLine(SocketManager.Counter);
                    SocketManager.Counter = 0;
                }
            });
            new OnPoolServer();
            Console.WriteLine("Running..");
            Console.ReadLine();
        }
    }
}