using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;

namespace OnPoolClient
{
    public static class Assert
    {
        public static void AreEqual<T>(T a, T b)
        {
            if (Equals(a, b))
                return;
            throw new Exception("Failed Test");
        }
    }

    public class Tests
    {
        private List<OnPoolClient> clients = new List<OnPoolClient>();

        public void TestClientResponse(LocalThreadManager threadManager)
        {
            BuildClientManager(manager1 =>
            {
                manager1.OnMessage((from, message, respond) =>
                {
                    Assert.AreEqual(message.Method, "Baz");
                    Assert.AreEqual(message.GetJson<int>(), 12);
                    respond(QueryParam.Json("foo1"));
                });
                manager1.OnReady(() =>
                {
                    manager1.JoinPool("TestPool", (from, message, respond) => { });

                    BuildClientManager(manager2 =>
                    {
                        manager2.OnMessage((from, message, respond) =>
                        {
                            Assert.AreEqual(message.Method, "Baz");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond(QueryParam.Json("foo2"));
                        });
                        manager2.OnReady(() =>
                        {
                            manager2.JoinPool("TestPool", (from, message, respond) => { });
                            BuildClientManager(manager3 =>
                            {
                                manager3.OnReady(() =>
                                {
                                    manager3.JoinPool("TestPool", (from, message, respond) => { });

                                    manager3.GetClients("TestPool", clients =>
                                    {
                                        var count = 0;
                                        clients[0].SendMessage(
                                            Query.Build("Baz", QueryDirection.Request, QueryType.Client, 12),
                                            q =>
                                            {
                                                count++;
                                                Assert.AreEqual(q.GetJson<string>(), "foo1");
                                                if (count == 2)
                                                    threadManager.Kill();
                                            }
                                        );

                                        clients[1].SendMessage(
                                            Query.Build("Baz", QueryDirection.Request, QueryType.Client, 13),
                                            q =>
                                            {
                                                count++;
                                                Assert.AreEqual(q.GetJson<string>(), "foo2");
                                                if (count == 2)
                                                    threadManager.Kill();
                                            }
                                        );
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
            var poolHit = 0;

            BuildClientManager(manager1 =>
            {
                manager1.OnReady(() =>
                {
                    manager1.JoinPool("TestPool2", (from, message, respond) =>
                    {
                        Assert.AreEqual(message.Method, "Baz");
                        if (poolHit == 0)
                        {
                            poolHit++;
                            Assert.AreEqual(message.GetJson<int>(), 12);
                            respond(QueryParam.Json(13));
                        }
                        else
                        {
                            Assert.AreEqual(message.GetJson<int>(), 14);
                            respond(QueryParam.Json(15));
                        }
                    });

                    BuildClientManager(manager2 =>
                    {
                        manager2.OnReady(() =>
                        {
                            manager2.JoinPool("TestPool2", (from, message, respond) =>
                            {
                                Assert.AreEqual(message.Method, "Bar");
                                Assert.AreEqual(message.GetJson<int>(), 13);
                                respond(QueryParam.Json(14));
                            });

                            BuildClientManager(manager3 =>
                            {
                                manager3.OnReady(() =>
                                {
                                    var countHit = 0;
                                    manager3.SendPoolMessage("TestPool2",
                                        Query.Build("Baz", QueryDirection.Request, QueryType.Pool, 12), m =>
                                        {
                                            Assert.AreEqual(m.GetJson<int>(), 13);
                                            countHit++;
                                            if (countHit == 3) threadManager.Kill();
                                        });
                                    manager3.SendPoolMessage("TestPool2",
                                        Query.Build("Bar", QueryDirection.Request, QueryType.Pool, 13), m =>
                                        {
                                            Assert.AreEqual(m.GetJson<int>(), 14);
                                            countHit++;
                                            if (countHit == 3) threadManager.Kill();
                                        });
                                    manager3.SendPoolMessage("TestPool2",
                                        Query.Build("Baz", QueryDirection.Request, QueryType.Pool, 14), m =>
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
        }

        public void TestDirectClientResponse(LocalThreadManager threadManager)
        {
            BuildClientManager(manager1 =>
            {
                manager1.OnReady(() =>
                {
                    manager1.OnMessage((from, message, respond) =>
                    {
                        Assert.AreEqual(message.Method, "Hi");
                        Assert.AreEqual(message.GetJson<int>(), 12);
                        respond(QueryParam.Json(20));
                    });

                    manager1.JoinPool("TestPool3", null);

                    BuildClientManager(manager2 =>
                    {
                        manager2.OnReady(() =>
                        {
                            manager1.GetClients("TestPool3", clients =>
                            {
                                var swim = clients.First();
                                manager2.SendMessage(
                                    swim.Id,
                                    Query.Build("Hi", QueryDirection.Request, QueryType.Client, 12),
                                    q =>
                                    {
                                        Assert.AreEqual(q.GetJson<int>(), 20);
                                        threadManager.Kill();
                                    }
                                );
                            });
                        });
                    });
                });
            });
        }

        public void TestAllPoolResponse(LocalThreadManager threadManager)
        {
            BuildClientManager(manager1 =>
            {
                manager1.OnReady(() =>
                {
                    manager1.JoinPool("TestPool4", (from, message, respond) =>
                    {
                        Assert.AreEqual(message.Method, "Bar");
                        Assert.AreEqual(message.GetJson<int>(), 13);
                        respond(QueryParam.Json(14));
                    });
                    BuildClientManager(manager2 =>
                    {
                        manager2.OnReady(() =>
                        {
                            manager2.JoinPool("TestPool4", (from, message, respond) =>
                            {
                                Assert.AreEqual(message.Method, "Bar");
                                Assert.AreEqual(message.GetJson<int>(), 13);
                                respond(QueryParam.Json(14));
                            });

                            BuildClientManager(manager3 =>
                            {
                                manager3.OnReady(() =>
                                {
                                    var countHit = 0;
                                    manager3.SendAllPoolMessage(
                                        "TestPool4",
                                        Query.Build("Bar", QueryDirection.Request, QueryType.PoolAll, 13),
                                        m =>
                                        {
                                            Assert.AreEqual(m.GetJson<int>(), 14);
                                            countHit++;
                                            if (countHit == 2) threadManager.Kill();
                                        }
                                    );
                                });
                            });

                        });
                    });

                });
            });
        }

        public void Test100ClientsAll(LocalThreadManager threadManager)
        {
            for (var i = 0; i < 100; i++)
            {
                BuildClientManager(manager =>
                {
                    manager.OnReady(() =>
                    {
                        manager.JoinPool("TestPool5", (from, message, respond) =>
                        {
                            Assert.AreEqual(message.Method, "Bar");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond(QueryParam.Json(14));
                        });
                    });
                });
            }


            BuildClientManager(manager =>
            {
                manager.OnReady(() =>
                {
                    var countHit = 0;
                    manager.SendAllPoolMessage("TestPool5", Query.Build("Bar", QueryDirection.Request, QueryType.PoolAll, 13), m =>
                                 {
                                     Assert.AreEqual(m.GetJson<int>(), 14);
                                     countHit++;
                                     if (countHit == 100) threadManager.Kill();
                                 });

                });
            });
        }

        public void TestSlammer(LocalThreadManager threadManager)
        {
            for (var i = 0; i < 10; i++)
            {
                BuildClientManager(manager =>
                {
                    manager.OnReady(() =>
                    {
                        manager.JoinPool("TestPool6", (from, message, respond) =>
                        {
                            Assert.AreEqual(message.Method, "Bar");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond(QueryParam.Json(14));
                        });
                    });
                });
            }


            BuildClientManager(manager =>
            {
                manager.OnReady(() =>
                {

                    Action exec = null;
                    exec = () =>
                    {
                        manager.SendPoolMessage(
                            "TestPool6",
                            Query.Build("Bar", QueryDirection.Request, QueryType.Pool, 13),
                            m =>
                            {
                                Assert.AreEqual(m.GetJson<int>(), 14);
                                exec();
                            }
                        );
                    };
                    exec();


                });
            });
        }

        private void BuildClientManager(Action<OnPoolClient> ready)
        {
            var c = new OnPoolClient();
            clients.Add(c);
            c.ConnectToServer("127.0.0.1");
            ready(c);
        }

        public void CleanupTest()
        {
            foreach (var clientBrokerManager in clients)
                clientBrokerManager.Disconnet();
            clients = new List<OnPoolClient>();
        }
    }
}