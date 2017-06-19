using System;
using System.Collections.Generic;
using System.Linq;
using BrokerCommon;

namespace BrokerClient
{
    public static class Assert
    {
        public static void AreEqual<T>(T a, T b)
        {
            if (Equals(a, b))
            {
                return;
            }
            throw new Exception("Failed Test");
        }
    }
    public class Tests
    {

        public void TestSwimmerResponse(LocalThreadManager threadManager)
        {
            BuildClientManager((manager1) =>
            {
                manager1.OnMessageWithResponse((from, message, respond) =>
                {
                    Assert.AreEqual(message.Method, "Baz");
                    Assert.AreEqual(message.GetJson<int>(), 12);
                    respond(message.Respond("foo1"));
                });
                manager1.OnReady(() =>
                {
                    manager1.GetPool("TestPool", pool =>
                    {
                        pool.JoinPool(() =>
                        {
                            BuildClientManager((manager2) =>
                            {
                                manager2.OnMessageWithResponse((from, message, respond) =>
                                {
                                    Assert.AreEqual(message.Method, "Baz");
                                    Assert.AreEqual(message.GetJson<int>(), 13);
                                    respond(message.Respond("foo2"));
                                });
                                manager2.OnReady(() =>
                                {
                                    manager2.GetPool("TestPool", pool2 =>
                                    {
                                        pool2.JoinPool(() =>
                                        {
                                            BuildClientManager((manager3) =>
                                            {
                                                manager3.OnReady(() =>
                                                {
                                                    manager3.GetPool("TestPool", pool3 =>
                                                    {
                                                        pool3.JoinPool(() =>
                                                        {
                                                            pool.GetSwimmers((swimmers) =>
                                                            {
                                                                var count = 0;
                                                                swimmers[0].SendMessageWithResponse(
                                                                    Query.Build("Baz", 12), (q) =>
                                                                    {
                                                                        count++;
                                                                        Assert.AreEqual(q.GetJson<string>(), "foo1");
                                                                        if (count == 2)
                                                                            threadManager.Kill();
                                                                    });

                                                                swimmers[1].SendMessageWithResponse(
                                                                    Query.Build("Baz", 13), (q) =>
                                                                    {
                                                                        count++;
                                                                        Assert.AreEqual(q.GetJson<string>(), "foo2");
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


        }

        public void TestPoolResponse(LocalThreadManager threadManager)
        {
            BuildClientManager((manager1) =>
            {
                manager1.OnReady(() =>
                {
                    manager1.GetPool("TestPool", pool1 =>
                    {
                        int poolHit = 0;
                        pool1.OnMessageWithResponse((from, message, respond) =>
                        {
                            Assert.AreEqual(message.Method, "Baz");
                            if (poolHit == 0)
                            {
                                poolHit++;
                                Assert.AreEqual(message.GetJson<int>(), 12);
                                respond(message.Respond(13));
                            }
                            else
                            {
                                Assert.AreEqual(message.GetJson<int>(), 14);
                                respond(message.Respond(15));
                            }
                        });

                        pool1.JoinPool(() =>
                        {
                            BuildClientManager((manager2) =>
                            {
                                manager2.OnReady(() =>
                                {
                                    manager2.GetPool("TestPool", pool2 =>
                                    {
                                        pool2.JoinPool(() =>
                                        {
                                            pool2.OnMessageWithResponse((from, message, respond) =>
                                            {
                                                Assert.AreEqual(message.Method, "Bar");
                                                Assert.AreEqual(message.GetJson<int>(), 13);
                                                respond(message.Respond(14));
                                            });

                                            BuildClientManager((manager3) =>
                                            {
                                                manager3.OnReady(() =>
                                                {
                                                    manager3.GetPool("TestPool", pool3 =>
                                                    {
                                                        int countHit = 0;
                                                        pool3.SendMessageWithResponse(Query.Build("Baz", 12), (m) =>
                                                        {
                                                            Assert.AreEqual(m.GetJson<int>(), 13);
                                                            countHit++;
                                                            if (countHit == 3) threadManager.Kill();
                                                        });
                                                        pool3.SendMessageWithResponse(Query.Build("Bar", 13), (m) =>
                                                        {
                                                            Assert.AreEqual(m.GetJson<int>(), 14);
                                                            countHit++;
                                                            if (countHit == 3) threadManager.Kill();
                                                        });
                                                        pool3.SendMessageWithResponse(Query.Build("Baz", 14), (m) =>
                                                        {
                                                            Assert.AreEqual(m.GetJson<int>(), 15);
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

        }

        public void TestDirectSwimmerResponse(LocalThreadManager threadManager)
        {
            BuildClientManager((manager1) =>
            {
                manager1.OnReady(() =>
                {
                    manager1.OnMessageWithResponse((from, message, respond) =>
                    {
                        Assert.AreEqual(message.Method, "Hi");
                        Assert.AreEqual(message.GetJson<int>(), 12);
                        respond(message.Respond(20));
                    });
                    manager1.GetPool("TestPool", pool1 =>
                    {
                        pool1.JoinPool(() =>
                        {
                            BuildClientManager((manager2) =>
                            {
                                manager2.OnReady(() =>
                                {
                                    manager2.GetPool("TestPool", pool2 =>
                                    {
                                        pool1.GetSwimmers((swimmers) =>
                                        {
                                            var swim = swimmers.First();
                                            manager2.SendMessageWithResponse(swim.Id, Query.Build("Hi", 12), (q) =>
                                            {
                                                Assert.AreEqual(q.GetJson<int>(), 20);
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

        }

        public void TestAllPoolResponse(LocalThreadManager threadManager)
        {
            BuildClientManager((manager1) =>
            {
                manager1.OnReady(() =>
                {
                    manager1.GetPool("TestPool", pool1 =>
                    {
                        pool1.OnMessageWithResponse((from, message, respond) =>
                        {
                            Assert.AreEqual(message.Method, "Bar");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond(message.Respond(14));
                        });

                        pool1.JoinPool(() =>
                        {
                            BuildClientManager((manager2) =>
                            {
                                manager2.OnReady(() =>
                                {
                                    manager2.GetPool("TestPool", pool2 =>
                                    {
                                        pool2.JoinPool(() =>
                                        {
                                            pool2.OnMessageWithResponse((from, message, respond) =>
                                            {
                                                Assert.AreEqual(message.Method, "Bar");
                                                Assert.AreEqual(message.GetJson<int>(), 13);
                                                respond(message.Respond(14));
                                            });

                                            BuildClientManager((manager3) =>
                                            {
                                                manager3.OnReady(() =>
                                                {
                                                    manager3.GetPool("TestPool", pool3 =>
                                                    {
                                                        int countHit = 0;
                                                        pool3.SendAllMessageWithResponse(Query.Build("Bar", 13), (m) =>
                                                        {
                                                            Assert.AreEqual(m.GetJson<int>(), 14);
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

        }
        
        public void Test100ClientsAll(LocalThreadManager threadManager)
        {
            for (int i = 0; i < 100; i++)
            {
                BuildClientManager((manager) =>
                {
                    manager.OnReady(() =>
                    {
                        manager.GetPool("TestPool", pool1 =>
                        {
                            pool1.OnMessageWithResponse((from, message, respond) =>
                            {
                                Assert.AreEqual(message.Method, "Bar");
                                Assert.AreEqual(message.GetJson<int>(), 13);
                                respond(message.Respond(14));
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
                    manager.GetPool("TestPool", pool3 =>
                    {
                        int countHit = 0;
                        pool3.SendAllMessageWithResponse(Query.Build("Bar", 13), (m) =>
                        {
                            Assert.AreEqual(m.GetJson<int>(), 14);
                            countHit++;
                            if (countHit == 100) threadManager.Kill();
                        });
                    });
                });
            });

        }

        public void TestSlammer(LocalThreadManager threadManager)
        {
            for (int i = 0; i < 10; i++)
            {
                BuildClientManager((manager) =>
                {
                    manager.OnReady(() =>
                    {
                        manager.GetPool("TestPool", pool1 =>
                        {
                            pool1.OnMessageWithResponse((from, message, respond) =>
                            {
                                Assert.AreEqual(message.Method, "Bar");
                                Assert.AreEqual(message.GetJson<int>(), 13);
                                respond(message.Respond(14));
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
                    manager.GetPool("TestPool", pool3 =>
                    {
                        Action exec = null;
                        exec = () =>
                        {
                            pool3.SendMessageWithResponse(Query.Build("Bar", 13),
                                (m) =>
                                {
                                    Assert.AreEqual(m.GetJson<int>(), 14);
                                    exec();
                                });
                        };
                        exec();
                    });
                });
            });


        }


        public List<ClientBrokerManager> clients = new List<ClientBrokerManager>();
        private void BuildClientManager(Action<ClientBrokerManager> ready)
        {
            var c = new ClientBrokerManager();
            clients.Add(c);
            c.ConnectToBroker("127.0.0.1");
            ready(c);
        }


    }
}
