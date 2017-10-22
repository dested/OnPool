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
      
            new OnPoolServer();
            Console.WriteLine("Running..");
            Console.ReadLine();
        }
    }
}