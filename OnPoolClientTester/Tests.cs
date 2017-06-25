using System;
using System.Collections.Generic;
using System.Linq;
using OnPoolCommon;

namespace OnPoolClientTester
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
        private List<OnPoolClient.OnPoolClient> connectedClients = new List<OnPoolClient.OnPoolClient>();

        public void TestLeavePool(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");
            OnPoolClient.OnPoolClient m2 = null;
            BuildClient(manager1 => {
                manager1.OnReady(() => {
                    int hitCount = 0;
                    manager1.OnPoolUpdated(poolName, (clients) => {
                        if (clients.Length == 1) {
                            hitCount++;
                            if (hitCount == 2) {
                                success();
                            }
                        }
                        else if (clients.Length == 2) {
                            m2.LeavePool(poolName);
                        }
                    });

                    manager1.JoinPool(poolName, (from, message, respond) => { });

                    BuildClient(manager2 => {
                        m2 = manager2;
                        manager2.OnReady(() => { manager2.JoinPool(poolName, (from, message, respond) => { }); });
                    });
                });
            });
        }

        public void TestOnPoolUpdatedResponse(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");

            BuildClient(manager1 => {
                manager1.OnReady(() => {
                    int hitCount = 0;
                    manager1.OnPoolUpdated(poolName, (clients) => {
                        hitCount++;
                        if (hitCount == 4) {
                            success();
                        }
                    });

                    manager1.JoinPool(poolName, (from, message, respond) => { });

                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager2.JoinPool(poolName, (from, message, respond) => { });
                            BuildClient(manager3 => {
                                manager3.OnReady(
                                    () => { manager3.JoinPool(poolName, (from, message, respond) => { }); });
                            });
                        });
                    });
                });
            });
        }


        public void TestOnPoolDisconnectedResponse(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");

            BuildClient(manager1 => {
                manager1.OnReady(() => {
                    int hitCount = 0;
                    manager1.OnPoolUpdated(poolName, (clients) => {
                        if (clients.Length == 0) {
                            hitCount++;
                            if (hitCount == 2) {
                                success();
                            }
                        }
                    });


                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager2.JoinPool(poolName, (from, message, respond) => { });
                            BuildClient(manager3 => {
                                manager3.OnReady(() => {
                                    manager3.JoinPool(poolName, (from, message, respond) => { });
                                    BuildClient(manager4 => {
                                        manager4.OnReady(() => {
                                            manager4.JoinPool(poolName, (from, message, respond) => { });
                                            manager4.Disconnet();
                                            manager3.Disconnet();
                                            manager2.Disconnet();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }


        public void TestClientResponse(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");


            BuildClient(manager1 => {
                manager1.OnMessage((from, message, respond) => {
                    Assert.AreEqual(message.Method, "Baz");
                    Assert.AreEqual(message.GetJson<int>(), 12);
                    respond(QueryParam.Json("foo1"));
                });
                manager1.OnReady(() => {
                    manager1.JoinPool(poolName, (from, message, respond) => { });

                    BuildClient(manager2 => {
                        manager2.OnMessage((from, message, respond) => {
                            Assert.AreEqual(message.Method, "Baz");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond(QueryParam.Json("foo2"));
                        });
                        manager2.OnReady(() => {
                            manager2.JoinPool(poolName, (from, message, respond) => { });
                            BuildClient(manager3 => {
                                manager3.OnReady(() => {
                                    manager3.JoinPool(poolName, (from, message, respond) => { });
                                    manager3.OnPoolUpdated(poolName, (clients) => {
                                        if (clients.Length == 3) {
                                            var count = 0;
                                            manager3.SendMessage(clients[0].Id,
                                                Query.Build("Baz", QueryDirection.Request, QueryType.Client, 12),
                                                q => {
                                                    count++;
                                                    Assert.AreEqual(q.GetJson<string>(), "foo1");
                                                    if (count == 2)
                                                        success();
                                                }
                                            );

                                            manager3.SendMessage(clients[1].Id,
                                                Query.Build("Baz", QueryDirection.Request, QueryType.Client, 13),
                                                q => {
                                                    count++;
                                                    Assert.AreEqual(q.GetJson<string>(), "foo2");
                                                    if (count == 2)
                                                        success();
                                                }
                                            );
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }

        public void TestPoolResponse(Action success)
        {
            var poolHit = 0;

            var poolName = Guid.NewGuid().ToString("N");
            BuildClient(manager1 => {
                manager1.OnReady(() => {
                    manager1.JoinPool(poolName, (from, message, respond) => {
                        Assert.AreEqual(message.Method, "Baz");
                        if (poolHit == 0) {
                            poolHit++;
                            Assert.AreEqual(message.GetJson<int>(), 12);
                            respond(QueryParam.Json(13));
                        }
                        else {
                            Assert.AreEqual(message.GetJson<int>(), 14);
                            respond(QueryParam.Json(15));
                        }
                    });

                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager2.JoinPool(poolName, (from, message, respond) => {
                                Assert.AreEqual(message.Method, "Bar");
                                Assert.AreEqual(message.GetJson<int>(), 13);
                                respond(QueryParam.Json(14));
                            });

                            BuildClient(manager3 => {
                                manager3.OnReady(() => {
                                    manager3.OnPoolUpdated(poolName, (clients) => {
                                        if (clients.Length == 2) {
                                            var countHit = 0;
                                            manager3.SendPoolMessage(poolName,
                                                Query.Build("Baz", QueryDirection.Request, QueryType.Pool, 12), m => {
                                                    Assert.AreEqual(m.GetJson<int>(), 13);
                                                    countHit++;
                                                    if (countHit == 3) success();
                                                });
                                            manager3.SendPoolMessage(poolName,
                                                Query.Build("Bar", QueryDirection.Request, QueryType.Pool, 13), m => {
                                                    Assert.AreEqual(m.GetJson<int>(), 14);
                                                    countHit++;
                                                    if (countHit == 3) success();
                                                });
                                            manager3.SendPoolMessage(poolName,
                                                Query.Build("Baz", QueryDirection.Request, QueryType.Pool, 14), m => {
                                                    Assert.AreEqual(m.GetJson<int>(), 15);
                                                    countHit++;
                                                    if (countHit == 3) success();
                                                });
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }

        public void TestDirectClientResponse(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");
            BuildClient(manager1 => {
                manager1.OnReady(() => {
                    manager1.OnMessage((from, message, respond) => {
                        Assert.AreEqual(message.Method, "Hi");
                        Assert.AreEqual(message.GetJson<int>(), 12);
                        respond(QueryParam.Json(20));
                    });

                    manager1.JoinPool(poolName, null);

                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager1.OnPoolUpdated(poolName, clients => {
                                if (clients.Length == 1) {
                                    var swim = clients.First();
                                    manager2.SendMessage(
                                        swim.Id,
                                        Query.Build("Hi", QueryDirection.Request, QueryType.Client, 12),
                                        q => {
                                            Assert.AreEqual(q.GetJson<int>(), 20);
                                            success();
                                        }
                                    );
                                }
                            });
                        });
                    });
                });
            });
        }

        public void TestAllPoolResponse(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");

            BuildClient(manager1 => {
                manager1.OnReady(() => {
                    manager1.JoinPool(poolName, (from, message, respond) => {
                        Assert.AreEqual(message.Method, "Bar");
                        Assert.AreEqual(message.GetJson<int>(), 13);
                        respond(QueryParam.Json(14));
                    });
                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager2.JoinPool(poolName, (from, message, respond) => {
                                Assert.AreEqual(message.Method, "Bar");
                                Assert.AreEqual(message.GetJson<int>(), 13);
                                respond(QueryParam.Json(14));
                            });

                            BuildClient(manager3 => {
                                manager3.OnReady(() => {
                                    manager3.OnPoolUpdated(poolName, (clients) => {
                                        if (clients.Length == 2) {
                                            var countHit = 0;
                                            manager3.SendAllPoolMessage(
                                                poolName,
                                                Query.Build("Bar", QueryDirection.Request, QueryType.PoolAll, 13),
                                                m => {
                                                    Assert.AreEqual(m.GetJson<int>(), 14);
                                                    countHit++;
                                                    if (countHit == 2) success();
                                                }
                                            );
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }

        public void Test100ClientsAll(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");
            var total = 100;
            for (var i = 0; i < total; i++) {
                BuildClient(manager => {
                    manager.OnReady(() => {
                        manager.JoinPool(poolName, (from, message, respond) => {
                            Assert.AreEqual(message.Method, "Bar");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond(QueryParam.Json(14));
                        });
                    });
                });
            }


            BuildClient(manager => {
                manager.OnReady(() => {
                    manager.OnPoolUpdated(poolName, (clients) => {
                        if (clients.Length == total) {
                            var countHit = 0;
                            manager.SendAllPoolMessage(poolName,
                                Query.Build("Bar", QueryDirection.Request, QueryType.PoolAll, 13), m => {
                                    Assert.AreEqual(m.GetJson<int>(), 14);
                                    countHit++;
                                    if (countHit == 100) success();
                                }
                            );
                        }
                    });
                });
            });
        }

        public void TestEveryone(Action success)
        {
            var total = 50;

            BuildClient(manager => {
                manager.OnReady(() => {
                    manager.OnPoolUpdated("Everyone", (clients) => {
                        if (clients.Length == 1) {
                            for (var i = 0; i < total; i++) {
                                BuildClient(m => { });
                            }
                        }
                        else if (clients.Length == total) {
                            success();
                        }
                    });
                });
            });
        }


        public void TestSlammer(Action success)
        {
            Console.WriteLine("Started Slammer");
            var poolName = Guid.NewGuid().ToString("N");
            var total = 10;
            for (var i = 0; i < total; i++) {
                BuildClient(manager => {
                    manager.OnReady(() => {
                        manager.JoinPool(poolName, (from, message, respond) => {
                            Assert.AreEqual(message.Method, "Bar");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond(QueryParam.Json(14));
                        });
                    });
                });
            }


            BuildClient(manager => {
                manager.OnReady(() => {
                    manager.OnPoolUpdated(poolName, (clients) => {
                        if (clients.Length == total) {
                            Action exec = null;
                            exec = () => {
                                manager.SendPoolMessage(poolName,
                                    Query.Build("Bar", QueryDirection.Request, QueryType.Pool, 13),
                                    m => {
                                        Assert.AreEqual(m.GetJson<int>(), 14);
                                        exec();
                                    }
                                );
                            };
                            exec();
                        }
                    });
                });
            });
        }

        private void BuildClient(Action<OnPoolClient.OnPoolClient> ready)
        {
            var c = new OnPoolClient.OnPoolClient();
            connectedClients.Add(c);
            c.ConnectToServer("127.0.0.1");
            ready(c);
        }

        public void CleanupTest()
        {
            foreach (var clientBrokerManager in connectedClients)
                clientBrokerManager.Disconnet();
            connectedClients = new List<OnPoolClient.OnPoolClient>();
        }
    }
}