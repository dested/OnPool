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
                        if (clients.Length == 1)
                        {
                            hitCount++;
                            if (hitCount == 2)
                            {
                                success();
                            }
                        }
                        else if (clients.Length == 2)
                        {
                            m2.LeavePool(poolName);
                        }
                    });

                    manager1.JoinPool(poolName);
                    BuildClient(manager2 => {
                        m2 = manager2;
                        manager2.OnReady(() => { manager2.JoinPool(poolName); });
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
                        if (hitCount == 4)
                        {
                            success();
                        }
                    });

                    manager1.JoinPool(poolName);

                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager2.JoinPool(poolName);
                            BuildClient(manager3 => {
                                manager3.OnReady(
                                    () => { manager3.JoinPool(poolName); });
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
                        if (clients.Length == 0)
                        {
                            hitCount++;
                            if (hitCount == 2)
                            {
                                success();
                            }
                        }
                    });


                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager2.JoinPool(poolName);
                            BuildClient(manager3 => {
                                manager3.OnReady(() => {
                                    manager3.JoinPool(poolName);
                                    BuildClient(manager4 => {
                                        manager4.OnReady(() => {
                                            manager4.JoinPool(poolName);
                                            manager4.Disconnect();
                                            manager3.Disconnect();
                                            manager2.Disconnect();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }

        public void TestPoolToClient(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");

            long id1 = -1;
            long id2 = -1;
            BuildClient(manager1 => {
                manager1.OnReady(() => {
                    id1 = manager1.MyClientId;

                    manager1.JoinPool(poolName).OnMessage((from, message, respond) => {
                        Assert.AreEqual(from.Id, id2);
                        Assert.AreEqual(message.Method, "Baz");
                        Assert.AreEqual(message.GetJson<int>(), 13);
                        manager1.SendClientMessage(from.Id, "Biz");
                    });

                    BuildClient(manager2 => {
                        manager2.OnMessage((from, message, respond) => {
                            Assert.AreEqual(from.Id, id1);
                            Assert.AreEqual(message.Method, "Biz");
                            respond(null);
                            success();
                        });

                        manager2.OnReady(() => {
                            id2 = manager2.MyClientId;
                            manager2.OnPoolUpdated(poolName, (clients) => {
                                if (clients.Length == 1)
                                {
                                    manager2.SendPoolMessage(poolName, "Baz", 13);
                                }
                            });
                        });
                    });
                });
            });
        }


        public void TestFastestPool(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");
            var total = 100;
            for (var i = 0; i < total; i++)
            {
                BuildClient(manager => {
                    manager.OnReady(() => {
                        manager.JoinPool(poolName).OnMessage((from, message, respond) => {
                            Assert.AreEqual(message.Method, "Bar");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond(14);
                        });
                    });
                });
            }


            BuildClient(manager => {
                manager.OnReady(() => {
                    manager.OnPoolUpdated(poolName, (clients) => {
                        if (clients.Length == total)
                        {
                            manager.SendPoolFastestMessage<int>(poolName, "Bar", 13, m => {
                                    Assert.AreEqual(m, 14);
                                    success();
                                }
                            );
                        }
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
                    respond("foo1");
                });
                manager1.OnReady(() => {
                    manager1.JoinPool(poolName);

                    BuildClient(manager2 => {
                        manager2.OnMessage((from, message, respond) => {
                            Assert.AreEqual(message.Method, "Baz");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond("foo2");
                        });
                        manager2.OnReady(() => {
                            manager2.JoinPool(poolName);
                            BuildClient(manager3 => {
                                manager3.OnReady(() => {
                                    manager3.JoinPool(poolName);
                                    manager3.OnPoolUpdated(poolName, (clients) => {
                                        if (clients.Length == 3)
                                        {
                                            var count = 0;
                                            manager3.SendClientMessage<string>(clients[0].Id,
                                                "Baz",
                                                12,
                                                result => {
                                                    count++;
                                                    Assert.AreEqual(result, "foo1");
                                                    if (count == 2)
                                                        success();
                                                }
                                            );

                                            manager3.SendClientMessage<string>(clients[1].Id, "Baz", 13,
                                                result => {
                                                    count++;
                                                    Assert.AreEqual(result, "foo2");
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
                    manager1.JoinPool(poolName).OnMessage((from, message, respond) => {
                        Assert.AreEqual(message.Method, "Baz");
                        if (poolHit == 0)
                        {
                            poolHit++;
                            Assert.AreEqual(message.GetJson<int>(), 12);
                            respond(13);
                        }
                        else
                        {
                            Assert.AreEqual(message.GetJson<int>(), 14);
                            respond(15);
                        }
                    });

                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager2.JoinPool(poolName).OnMessage((from, message, respond) => {
                                Assert.AreEqual(message.Method, "Bar");
                                Assert.AreEqual(message.GetJson<int>(), 13);
                                respond(14);
                            });

                            BuildClient(manager3 => {
                                manager3.OnReady(() => {
                                    manager3.OnPoolUpdated(poolName, (clients) => {
                                        if (clients.Length == 2)
                                        {
                                            var countHit = 0;
                                            manager3.SendPoolMessage<int>(poolName, "Baz", 12,
                                                m => {
                                                    Assert.AreEqual(m, 13);
                                                    countHit++;
                                                    if (countHit == 3) success();
                                                });
                                            manager3.SendPoolMessage<int>(poolName, "Bar", 13, m => {
                                                Assert.AreEqual(m, 14);
                                                countHit++;
                                                if (countHit == 3) success();
                                            });
                                            manager3.SendPoolMessage<int>(poolName, "Baz", 14, m => {
                                                Assert.AreEqual(m, 15);
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

        public void TestClientSendObject(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");
            BuildClient(manager1 => {
                manager1.OnReady(() => {
                    manager1.OnMessage((from, message, respond) => {
                        Assert.AreEqual(message.Method, "Hi");
                        var payload = message.GetJson<Payload>();
                        Assert.AreEqual(payload.Foo, "hello");
                        Assert.AreEqual(payload.Bar, "Elido");
                        respond(new Payload() {Foo = "hi", Bar = "ashley"});
                    });

                    manager1.JoinPool(poolName);

                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager1.OnPoolUpdated(poolName, clients => {
                                if (clients.Length == 1)
                                {
                                    var swim = clients.First();
                                    manager2.SendClientMessage<Payload>(swim.Id, "Hi", new Payload() {Foo = "hello", Bar = "Elido"},
                                        q => {
                                            Assert.AreEqual(q.Foo, "hi");
                                            Assert.AreEqual(q.Bar, "ashley");
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

        public class Payload
        {
            public string Foo { get; set; }
            public string Bar { get; set; }
        }

        public void TestDirectClientResponse(Action success)
        {
            var poolName = Guid.NewGuid().ToString("N");
            BuildClient(manager1 => {
                manager1.OnReady(() => {
                    manager1.OnMessage((from, message, respond) => {
                        Assert.AreEqual(message.Method, "Hi");
                        Assert.AreEqual(message.GetJson<int>(), 12);
                        respond(20);
                    });

                    manager1.JoinPool(poolName);

                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager1.OnPoolUpdated(poolName, clients => {
                                if (clients.Length == 1)
                                {
                                    var swim = clients.First();
                                    manager2.SendClientMessage<int>(swim.Id, "Hi", 12,
                                        q => {
                                            Assert.AreEqual(q, 20);
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
                    manager1.JoinPool(poolName).OnMessage((from, message, respond) => {
                        Assert.AreEqual(message.Method, "Bar");
                        Assert.AreEqual(message.GetJson<int>(), 13);
                        respond(14);
                    });
                    BuildClient(manager2 => {
                        manager2.OnReady(() => {
                            manager2.JoinPool(poolName).OnMessage((from, message, respond) => {
                                Assert.AreEqual(message.Method, "Bar");
                                Assert.AreEqual(message.GetJson<int>(), 13);
                                respond(14);
                            });

                            BuildClient(manager3 => {
                                manager3.OnReady(() => {
                                    manager3.OnPoolUpdated(poolName, (clients) => {
                                        if (clients.Length == 2)
                                        {
                                            var countHit = 0;
                                            manager3.SendAllPoolMessage<int>(poolName, "Bar", 13, m => {
                                                    Assert.AreEqual(m, 14);
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
            for (var i = 0; i < total; i++)
            {
                BuildClient(manager => {
                    manager.OnReady(() => {
                        manager.JoinPool(poolName).OnMessage((from, message, respond) => {
                            Assert.AreEqual(message.Method, "Bar");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond(14);
                        });
                    });
                });
            }


            BuildClient(manager => {
                manager.OnReady(() => {
                    manager.OnPoolUpdated(poolName, (clients) => {
                        if (clients.Length == total)
                        {
                            var countHit = 0;
                            manager.SendAllPoolMessage<int>(poolName, "Bar", 13, m => {
                                    Assert.AreEqual(m, 14);
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
                        if (clients.Length == 1)
                        {
                            for (var i = 0; i < total; i++)
                            {
                                BuildClient(m => { });
                            }
                        }
                        else if (clients.Length == total)
                        {
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
            for (var i = 0; i < total; i++)
            {
                BuildClient(manager => {
                    manager.OnReady(() => {
                        manager.JoinPool(poolName).OnMessage((from, message, respond) => {
                            Assert.AreEqual(message.Method, "Bar");
                            Assert.AreEqual(message.GetJson<int>(), 13);
                            respond(14);
                        });
                    });
                });
            }


            BuildClient(manager => {
                manager.OnReady(() => {
                    manager.OnPoolUpdated(poolName, (clients) => {
                        if (clients.Length == total)
                        {
                            Action exec = null;
                            exec = () => {
                                manager.SendPoolMessage<int>(poolName, "Bar", 13, m => {
                                        Assert.AreEqual(m, 14);
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
                clientBrokerManager.Disconnect();
            connectedClients = new List<OnPoolClient.OnPoolClient>();
        }
    }
}