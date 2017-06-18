using System;
using System.ComponentModel;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using BrokerCommon;

namespace BrokerServer
{
    class Program
    {
        static void Main(string[] args)
        {

            var threadManager = LocalThreadManager.Start();
            var broker = new ServerBroker();
/*
            Task.Run(() =>
            {
                while (true)
                {
                    Thread.Sleep(1000);
                    Console.WriteLine(ClientConnection.counter);
                    ClientConnection.counter = 0;
                }
            });
*/
            threadManager.Process();
        }
    }
}
