using System.ComponentModel;
using System.IO;
using System.Text;
using System.Threading;
using BrokerCommon;

namespace BrokerServer
{
    class Program
    {
        static void Main(string[] args)
        {

            var threadManager = LocalThreadManager.Start();
            var broker = new ServerBroker();
            threadManager.Process();
        }
    }
}
