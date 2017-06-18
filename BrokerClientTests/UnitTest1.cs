using System;
using System.Threading;
using BrokerClient;
using BrokerCommon;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace BrokerClientTests
{
    [TestClass]
    public class UnitTest1
    {
        [TestMethod]
        public void TestMethod1()
        {
            SpinThread(() =>
            {
                BuildUp((manager) =>
                {
                    
                });

                BuildUp((manager) =>
                {
                });


            });


        }

        private void BuildUp(Action<ClientBrokerManager> ready)
        {
            var threadManager = LocalThreadManager.Start();

            var c = new ClientBrokerManager();
            c.ConnectToBroker("127.0.0.1");
            c.OnDisconnect += () => { };

            ready(c);

            threadManager.Process();
        }

        private void SpinThread(Action ready)
        {
            var threadManager = LocalThreadManager.Start();

            ready();

            threadManager.Process();
        }


    }
}
