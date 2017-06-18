
import { ClientBrokerManager } from "./clientBrokerManager";
import { Query } from "./common/query";


export class Tests {

    private assertAreEqual<T>(a: T, b: T, testFail: (reason: string) => void) {
        if (a === b) {
            return;
        }
        testFail(`Assert Failed ${a} ${b}`);
        throw `Assert Failed ${a} ${b}`;
    }

    public TestSwimmerResponse(testPass: () => void, testFail: (reason: string) => void): void {
        this.BuildClientManager((manager1) => {
            manager1.OnMessageWithResponse((query, respond) => {
                this.assertAreEqual(query.Method, "Baz", testFail);
                this.assertAreEqual(query.GetJson<number>(), 12, testFail);
                respond(query.RespondWithJson("foo1"));
            });
            manager1.OnReady(() => {
                manager1.GetPool("GameServers",
                    pool => {
                        pool.JoinPool(() => {
                            this.BuildClientManager((manager2) => {
                                manager2.OnMessageWithResponse((query, respond) => {
                                    this.assertAreEqual(query.Method, "Baz", testFail);
                                    this.assertAreEqual(query.GetJson<number>(), 13, testFail);
                                    respond(query.RespondWithJson("foo2"));
                                });
                                manager2.OnReady(() => {
                                    manager2.GetPool("GameServers",
                                        pool2 => {
                                            pool2.JoinPool(() => {
                                                this.BuildClientManager((manager3) => {
                                                    manager3.OnReady(() => {
                                                        manager3.GetPool("GameServers",
                                                            pool3 => {
                                                                pool3.JoinPool(() => {
                                                                    pool.GetSwimmers((swimmers) => {
                                                                        var count = 0;
                                                                        swimmers[0].SendMessageWithResponse<string>(
                                                                            Query.BuildWithJson("Baz", 12),
                                                                            (q) => {
                                                                                count++;
                                                                                this.assertAreEqual(q,
                                                                                    "foo1",
                                                                                    testFail);
                                                                                if (count === 2)
                                                                                    testPass();
                                                                            });
                                                                        swimmers[1].SendMessageWithResponse<string>(
                                                                            Query.BuildWithJson("Baz", 13),
                                                                            (q) => {
                                                                                count++;
                                                                                this.assertAreEqual(q,
                                                                                    "foo2",
                                                                                    testFail);
                                                                                if (count === 2)
                                                                                    testPass();
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


    public TestPoolResponse(testPass: () => void, testFail: (reason: string) => void): void {

        this.BuildClientManager((manager1) => {
            manager1.OnReady(() => {
                manager1.GetPool("GameServers",
                    pool1 => {
                        let poolHit = 0;
                        pool1.OnMessageWithResponse((q, respond) => {
                            this.assertAreEqual(q.Method, "Baz", testFail);
                            if (poolHit === 0) {
                                poolHit++;
                                this.assertAreEqual(q.GetJson<number>(), 12, testFail);
                                respond(q.RespondWithJson(13));
                            } else {
                                this.assertAreEqual(q.GetJson<number>(), 14, testFail);
                                respond(q.RespondWithJson(15));
                            }
                        });

                        pool1.JoinPool(() => {
                            this.BuildClientManager((manager2) => {
                                manager2.OnReady(() => {
                                    manager2.GetPool("GameServers",
                                        pool2 => {
                                            pool2.JoinPool(() => {
                                                pool2.OnMessageWithResponse((q, respond) => {
                                                    this.assertAreEqual(q.Method, "Bar", testFail);
                                                    this.assertAreEqual(q.GetJson<number>(), 13, testFail);
                                                    respond(q.RespondWithJson(14));
                                                });

                                                this.BuildClientManager((manager3) => {
                                                    manager3.OnReady(() => {
                                                        manager3.GetPool("GameServers",
                                                            pool3 => {
                                                                let countHit = 0;
                                                                pool3.SendMessageWithResponse<number>(
                                                                    Query.BuildWithJson("Baz", 12),
                                                                    (m) => {
                                                                        this.assertAreEqual(m, 13, testFail);
                                                                        countHit++;
                                                                        if (countHit === 3) testPass();
                                                                    });
                                                                pool3.SendMessageWithResponse<number>(
                                                                    Query.BuildWithJson("Bar", 13),
                                                                    (m) => {
                                                                        this.assertAreEqual(m, 14, testFail);
                                                                        countHit++;
                                                                        if (countHit === 3) testPass();
                                                                    });
                                                                pool3.SendMessageWithResponse<number>(
                                                                    Query.BuildWithJson("Baz", 14),
                                                                    (m) => {
                                                                        this.assertAreEqual(m, 15, testFail);
                                                                        countHit++;
                                                                        if (countHit === 3) testPass();
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


    public TestAllPoolResponse(testPass: () => void, testFail: (reason: string) => void): void {

        this.BuildClientManager((manager1) => {
            manager1.OnReady(() => {
                manager1.GetPool("GameServers",
                    pool1 => {
                        pool1.OnMessageWithResponse((q, respond) => {
                            this.assertAreEqual(q.Method, "Bar", testFail);
                            this.assertAreEqual(q.GetJson<number>(), 13, testFail);
                            respond(q.RespondWithJson(14));
                        });

                        pool1.JoinPool(() => {
                            this.BuildClientManager((manager2) => {
                                manager2.OnReady(() => {
                                    manager2.GetPool("GameServers",
                                        pool2 => {
                                            pool2.JoinPool(() => {
                                                pool2.OnMessageWithResponse((q, respond) => {
                                                    this.assertAreEqual(q.Method, "Bar", testFail);
                                                    this.assertAreEqual(q.GetJson<number>(), 13, testFail);
                                                    respond(q.RespondWithJson(14));
                                                });

                                                this.BuildClientManager((manager3) => {
                                                    manager3.OnReady(() => {
                                                        manager3.GetPool("GameServers",
                                                            pool3 => {
                                                                let countHit = 0;
                                                                pool3.SendAllMessageWithResponse<number>(
                                                                    Query.BuildWithJson("Bar", 13),
                                                                    (m) => {
                                                                        this.assertAreEqual(m, 14, testFail);
                                                                        countHit++;
                                                                        if (countHit === 2) testPass();
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


    public Test100ClientsAll(testPass: () => void, testFail: (reason: string) => void): void {

        for (let i = 0; i < 100; i++) {
            this.BuildClientManager((manager) => {
                manager.OnReady(() => {
                    manager.GetPool("GameServers",
                        pool1 => {
                            pool1.OnMessageWithResponse((q, respond) => {
                                this.assertAreEqual(q.Method, "Bar", testFail);
                                this.assertAreEqual(q.GetJson<number>(), 13, testFail);
                                respond(q.RespondWithJson(14));
                            });

                            pool1.JoinPool(() => {
                            });
                        });
                });
            });
        }


        this.BuildClientManager((manager) => {
            manager.OnReady(() => {
                manager.GetPool("GameServers",
                    pool3 => {
                        let countHit = 0;
                        pool3.SendAllMessageWithResponse<number>(Query.BuildWithJson("Bar", 13),
                            (m) => {
                                this.assertAreEqual(m, 14, testFail);
                                countHit++;
                                if (countHit === 100) testPass();;
                            });
                    });
            });
        });
    }


    private clients: ClientBrokerManager[] = [];

    private BuildClientManager(ready: (_: ClientBrokerManager) => void): void {
        var c = new ClientBrokerManager();
        this.clients.push(c);
        c.ConnectToBroker("127.0.0.1");
        ready(c);
    }

    run(test: (testPass: () => void, testFail: (reason: string) => void) => void): Promise<void> {
        return new Promise<void>((res, rej) => {
            test.call(this,
                () => {
                    console.log('test passed '+test.name);
                    for (var i = 0; i < this.clients.length; i++) {
                        var client = this.clients[i];
                        client.Disconnet();
                    }
                    this.clients = [];
                    res();
                },
                (reason: string) =>
                    rej(reason)
            );
        });
    }
}