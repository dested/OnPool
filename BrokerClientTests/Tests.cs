using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BrokerClient;
using BrokerCommon;
using BrokerServer;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace BrokerClientTests
{

    [TestClass]
    public class Tests
    {
        private LocalThreadManager threadManager;

        [TestMethod]
        public void TestSwimmerResponse()
        {
            SpinThread(() =>
            {
                BuildClientManager((manager1) =>
                {
                    manager1.OnMessageWithResponse((query, respond) =>
                    {
                        Assert.AreEqual(query.Method, "Baz");
                        Assert.AreEqual(query.GetJson<int>(), 12);
                        respond(query.Respond("foo1"));
                    });
                    manager1.OnReady(() =>
                    {
                        manager1.GetPool("GameServers", pool =>
                        {
                            pool.JoinPool(() =>
                            {
                                BuildClientManager((manager2) =>
                                {
                                    manager2.OnMessageWithResponse((query, respond) =>
                                    {
                                        Assert.AreEqual(query.Method, "Baz");
                                        Assert.AreEqual(query.GetJson<int>(), 13);
                                        respond(query.Respond("foo2"));
                                    });
                                    manager2.OnReady(() =>
                                    {
                                        manager2.GetPool("GameServers", pool2 =>
                                        {
                                            pool2.JoinPool(() =>
                                            {
                                                BuildClientManager((manager3) =>
                                                {
                                                    manager3.OnReady(() =>
                                                    {
                                                        manager3.GetPool("GameServers", pool3 =>
                                                        {
                                                            pool3.JoinPool(() =>
                                                            {
                                                                pool.GetSwimmers((swimmers) =>
                                                                {
                                                                    var count = 0;
                                                                    swimmers[0].SendMessageWithResponse<string>(
                                                                        Query.Build("Baz", 12), (q) =>
                                                                        {
                                                                            count++;
                                                                            Assert.AreEqual(q, "foo1");
                                                                            if (count == 2)
                                                                                threadManager.Kill();
                                                                        });

                                                                    swimmers[1].SendMessageWithResponse<string>(
                                                                        Query.Build("Baz", 13), (q) =>
                                                                        {
                                                                            count++;
                                                                            Assert.AreEqual(q, "foo2");
                                                                            if (count == 2)
                                                                                threadManager.Kill();
                                                                        });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

            });
        
        }



        [TestMethod]
        public void TestPoolResponse()
        {
            SpinThread(() =>
            {
                BuildClientManager((manager1) =>
                {
                    manager1.OnReady(() =>
                    {
                        manager1.GetPool("GameServers", pool1 =>
                        {
                            int poolHit = 0;
                            pool1.OnMessageWithResponse((q, respond) =>
                            {
                                Assert.AreEqual(q.Method, "Baz");
                                if (poolHit == 0)
                                {
                                    poolHit++;
                                    Assert.AreEqual(q.GetJson<int>(), 12);
                                    respond(q.Respond(13));
                                }
                                else
                                {
                                    Assert.AreEqual(q.GetJson<int>(), 14);
                                    respond(q.Respond(15));
                                }
                            });

                            pool1.JoinPool(() =>
                            {
                                BuildClientManager((manager2) =>
                                {
                                    manager2.OnReady(() =>
                                    {
                                        manager2.GetPool("GameServers", pool2 =>
                                        {
                                            pool2.JoinPool(() =>
                                            {
                                                pool2.OnMessageWithResponse((q, respond) =>
                                                {
                                                    Assert.AreEqual(q.Method, "Bar");
                                                    Assert.AreEqual(q.GetJson<int>(), 13);
                                                    respond(q.Respond(14));
                                                });

                                                BuildClientManager((manager3) =>
                                                {
                                                    manager3.OnReady(() =>
                                                    {
                                                        manager3.GetPool("GameServers", pool3 =>
                                                        {
                                                            int countHit = 0;
                                                            pool3.SendMessageWithResponse<int>(Query.Build("Baz", 12), (m) =>
                                                            {
                                                                Assert.AreEqual(m, 13);
                                                                countHit++;
                                                                if (countHit == 3) threadManager.Kill();
                                                            });
                                                            pool3.SendMessageWithResponse<int>(Query.Build("Bar", 13), (m) =>
                                                            {
                                                                Assert.AreEqual(m, 14);
                                                                countHit++;
                                                                if (countHit == 3) threadManager.Kill();
                                                            });
                                                            pool3.SendMessageWithResponse<int>(Query.Build("Baz", 14), (m) =>
                                                            {
                                                                Assert.AreEqual(m, 15);
                                                                countHit++;
                                                                if (countHit == 3) threadManager.Kill();
                                                            });

                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

            });

        }



        [TestMethod]
        public void TestAllPoolResponse()
        {
            SpinThread(() =>
            {
                BuildClientManager((manager1) =>
                {
                    manager1.OnReady(() =>
                    {
                        manager1.GetPool("GameServers", pool1 =>
                        {
                            pool1.OnMessageWithResponse((q, respond) =>
                            {
                                Assert.AreEqual(q.Method, "Bar");
                                Assert.AreEqual(q.GetJson<int>(), 13);
                                respond(q.Respond(14));
                            });

                            pool1.JoinPool(() =>
                            {
                                BuildClientManager((manager2) =>
                                {
                                    manager2.OnReady(() =>
                                    {
                                        manager2.GetPool("GameServers", pool2 =>
                                        {
                                            pool2.JoinPool(() =>
                                            {
                                                pool2.OnMessageWithResponse((q, respond) =>
                                                {
                                                    Assert.AreEqual(q.Method, "Bar");
                                                    Assert.AreEqual(q.GetJson<int>(), 13);
                                                    respond(q.Respond(14));
                                                });

                                                BuildClientManager((manager3) =>
                                                {
                                                    manager3.OnReady(() =>
                                                    {
                                                        manager3.GetPool("GameServers", pool3 =>
                                                        {
                                                            int countHit = 0;
                                                            pool3.SendAllMessageWithResponse<int>(Query.Build("Bar", 13), (m) =>
                                                            {
                                                                Assert.AreEqual(m, 14);
                                                                countHit++;
                                                                if (countHit == 2) threadManager.Kill();
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

            });

        }


        [TestMethod]
        public void Test100ClientsAll()
        {
            SpinThread(() =>
            {

                for (int i = 0; i < 100; i++)
                {
                    BuildClientManager((manager) =>
                    {
                        manager.OnReady(() =>
                        {
                            manager.GetPool("GameServers", pool1 =>
                            {
                                pool1.OnMessageWithResponse((q, respond) =>
                                {
                                    Assert.AreEqual(q.Method, "Bar");
                                    Assert.AreEqual(q.GetJson<int>(), 13);
                                    respond(q.Respond(14));
                                });

                                pool1.JoinPool(() =>
                                {
                                });
                            });
                        });
                    });
                }


                BuildClientManager((manager) =>
                {
                    manager.OnReady(() =>
                    {
                        manager.GetPool("GameServers", pool3 =>
                        {
                            int countHit = 0;
                            pool3.SendAllMessageWithResponse<int>(Query.Build("Bar", 13), (m) =>
                            {
                                Assert.AreEqual(m, 14);
                                countHit++;
                                if (countHit == 100) threadManager.Kill();
                            });
                        });
                    });
                });


            });
        }


        [TestMethod]
        public void TestSlammer()
        {
            SpinThread(() =>
            {

                for (int i = 0; i < 10; i++)
                {
                    BuildClientManager((manager) =>
                    {
                        manager.OnReady(() =>
                        {
                            manager.GetPool("GameServers", pool1 =>
                            {
                                pool1.OnMessageWithResponse((q, respond) =>
                                {
                                    Assert.AreEqual(q.Method, "Bar");
                                    Assert.AreEqual(q.GetJson<int>(), 13);
                                    respond(q.Respond(14));
                                });

                                pool1.JoinPool(() =>
                                {
                                });
                            });
                        });
                    });
                }


                BuildClientManager((manager) =>
                {
                    manager.OnReady(() =>
                    {
                        manager.GetPool("GameServers", pool3 =>
                        {
                            Action exec = null;
                            exec = () =>
                            {
                                pool3.SendMessageWithResponse<int>(Query.Build("Bar", 13),
                                    (m) =>
                                    {
                                        Assert.AreEqual(m, 14);
                                        exec();
                                    });
                            };
                            exec();
                        });
                    });
                });


            });
             
        }
         


        private ServerBroker broker ;
        private List<ClientBrokerManager> clients = new List<ClientBrokerManager>();
        private void BuildClientManager(Action<ClientBrokerManager> ready)
        {
            var c = new ClientBrokerManager();
            clients.Add(c);
            c.ConnectToBroker("127.0.0.1");
            ready(c);
        }

        private void SpinThread(Action ready)
        {
            threadManager = LocalThreadManager.Start();
//            broker=new ServerBroker();
            ready();

            threadManager.Process();
            foreach (var client in clients)
            {
                client.Disconnet();
            }
            clients=new List<ClientBrokerManager>();
//            broker?.Disconnect();
        }


    }
}
