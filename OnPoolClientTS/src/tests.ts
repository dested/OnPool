
import { Query } from "./common/query";
import { OnPoolClient } from "./onPoolClient";
import { Utils } from "./common/utils";

export class Tests {

    private assertAreEqual<T>(a: T, b: T, testFail: (reason: string) => void) {
        if (a === b) {
            return;
        }
        testFail(`Assert Failed ${a} ${b}`);
        throw `Assert Failed ${a} ${b}`;
    }

    private connectedClients: OnPoolClient[] = [];
    public TestLeavePool(success: () => void, testFail: (reason: string) => void): void {
        const poolName = Utils.guid();
        let m2: OnPoolClient = null;
        this.BuildClient(manager1 => {
            manager1.OnReady(() => {
                let hitCount: number = 0;
                manager1.OnPoolUpdated(poolName, (clients) => {
                    if (clients.length === 1) {
                        hitCount++;
                        if (hitCount === 2) {
                            success();
                        }
                    }
                    else if (clients.length == 2) {
                        m2.LeavePool(poolName);
                    }
                });
                manager1.JoinPool(poolName);
                this.BuildClient(manager2 => {
                    m2 = manager2;
                    manager2.OnReady(() => {
                        manager2.JoinPool(poolName);
                    });
                });
            });
        });
    }
    public TestOnPoolUpdatedResponse(success: () => void, testFail: (reason: string) => void): void {
        const poolName = Utils.guid();
        this.BuildClient(manager1 => {
            manager1.OnReady(() => {
                let hitCount: number = 0;
                manager1.OnPoolUpdated(poolName, (clients) => {
                    hitCount++;
                    if (hitCount === 4) {
                        success();
                    }
                });
                manager1.JoinPool(poolName);
                this.BuildClient(manager2 => {
                    manager2.OnReady(() => {
                        manager2.JoinPool(poolName);
                        this.BuildClient(manager3 => {
                            manager3.OnReady(() => {
                                manager3.JoinPool(poolName);
                            });
                        });
                    });
                });
            });
        });
    }
    public TestOnPoolDisconnectedResponse(success: () => void, testFail: (reason: string) => void): void {
        const poolName = Utils.guid();
        this.BuildClient(manager1 => {
            manager1.OnReady(() => {
                let hitCount: number = 0;
                manager1.OnPoolUpdated(poolName, (clients) => {
                    if (clients.length === 0) {
                        hitCount++;
                        if (hitCount === 2) {
                            success();
                        }
                    }
                });
                this.BuildClient(manager2 => {
                    manager2.OnReady(() => {
                        manager2.JoinPool(poolName);
                        this.BuildClient(manager3 => {
                            manager3.OnReady(() => {
                                manager3.JoinPool(poolName);
                                this.BuildClient(manager4 => {
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
    public TestClientResponse(success: () => void, testFail: (reason: string) => void): void {
        const poolName = Utils.guid();
        this.BuildClient(manager1 => {
            manager1.OnMessage((from, message, respond) => {
                this.assertAreEqual(message.Method, "Baz", testFail);
                this.assertAreEqual(message.GetJson<number>(), 12, testFail);
                respond("foo1");
            });
            manager1.OnReady(() => {
                manager1.JoinPool(poolName);
                this.BuildClient(manager2 => {
                    manager2.OnMessage((from, message, respond) => {
                        this.assertAreEqual(message.Method, "Baz", testFail);
                        this.assertAreEqual(message.GetJson<number>(), 13, testFail);
                        respond("foo2");
                    });
                    manager2.OnReady(() => {
                        manager2.JoinPool(poolName);
                        this.BuildClient(manager3 => {
                            manager3.OnReady(() => {
                                manager3.JoinPool(poolName);
                                manager3.OnPoolUpdated(poolName, (clients) => {
                                    if (clients.length === 3) {
                                        let count = 0;
                                        manager3.SendClientMessage<string>(clients[0].Id,
                                            "Baz",
                                            12,
                                            result => {
                                                count++;
                                                this.assertAreEqual(result, "foo1", testFail);
                                                if (count == 2)
                                                    success();
                                            });
                                        manager3.SendClientMessage<string>(clients[1].Id, "Baz", 13,
                                            result => {
                                                count++;
                                                this.assertAreEqual(result, "foo2", testFail);
                                                if (count == 2)
                                                    success();
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
    public TestPoolResponse(success: () => void, testFail: (reason: string) => void): void {
        let poolHit = 0;
        const poolName = Utils.guid();
        this.BuildClient(manager1 => {
            manager1.OnReady(() => {
                manager1.JoinPool(poolName).OnMessage((from, message, respond) => {
                    this.assertAreEqual(message.Method, "Baz", testFail);
                    if (poolHit == 0) {
                        poolHit++;
                        this.assertAreEqual(message.GetJson<number>(), 12, testFail);
                        respond(13);
                    }
                    else {
                        this.assertAreEqual(message.GetJson<number>(), 14, testFail);
                        respond(15);
                    }
                });
                this.BuildClient(manager2 => {
                    manager2.OnReady(() => {
                        manager2.JoinPool(poolName).OnMessage((from, message, respond) => {
                            this.assertAreEqual(message.Method, "Bar", testFail);
                            this.assertAreEqual(message.GetJson<number>(), 13, testFail);
                            respond(14);
                        });
                        this.BuildClient(manager3 => {
                            manager3.OnReady(() => {
                                manager3.OnPoolUpdated(poolName, (clients) => {
                                    if (clients.length === 2) {
                                        let countHit = 0;
                                        manager3.SendPoolMessage<number>(poolName, "Baz", 12,
                                            m => {
                                                this.assertAreEqual(m, 13, testFail);
                                                countHit++;
                                                if (countHit == 3)
                                                    success();
                                            });
                                        manager3.SendPoolMessage<number>(poolName, "Bar", 13, m => {
                                            this.assertAreEqual(m, 14, testFail);
                                            countHit++;
                                            if (countHit == 3)
                                                success();
                                        });
                                        manager3.SendPoolMessage<number>(poolName, "Baz", 14, m => {
                                            this.assertAreEqual(m, 15, testFail);
                                            countHit++;
                                            if (countHit == 3)
                                                success();
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
    public TestClientSendObject(success: () => void, testFail: (reason: string) => void): void {
        const poolName = Utils.guid();
        this.BuildClient(manager1 => {
            manager1.OnReady(() => {
                manager1.OnMessage((from, message, respond) => {
                    this.assertAreEqual(message.Method, "Hi", testFail);
                    const payload = message.GetJson<Payload>();
                    this.assertAreEqual(payload.Foo, "hello", testFail);
                    this.assertAreEqual(payload.Bar, "Elido", testFail);
                    const p = new Payload();
                    p.Foo = "hi";
                    p.Bar = "ashley";
                    respond(p);
                });
                manager1.JoinPool(poolName);
                this.BuildClient(manager2 => {
                    manager2.OnReady(() => {
                        manager1.OnPoolUpdated(poolName, clients => {
                            if (clients.length === 1) {
                                const swim = clients[0];
                                const p = new Payload();
                                p.Foo = "hello";
                                p.Bar = "Elido";

                                manager2.SendClientMessage<Payload>(swim.Id, "Hi", p,
                                    q => {
                                        this.assertAreEqual(q.Foo, "hi", testFail);
                                        this.assertAreEqual(q.Bar, "ashley", testFail);
                                        success();
                                    });
                            }
                        });
                    });
                });
            });
        });
    }

    public TestDirectClientResponse(success: () => void, testFail: (reason: string) => void): void {
        const poolName = Utils.guid();
        this.BuildClient(manager1 => {
            manager1.OnReady(() => {
                manager1.OnMessage((from, message, respond) => {
                    this.assertAreEqual(message.Method, "Hi", testFail);
                    this.assertAreEqual(message.GetJson<number>(), 12, testFail);
                    respond(20);
                });
                manager1.JoinPool(poolName);
                this.BuildClient(manager2 => {
                    manager2.OnReady(() => {
                        manager1.OnPoolUpdated(poolName, clients => {
                            if (clients.length === 1) {
                                const swim = clients[0];
                                manager2.SendClientMessage<number>(swim.Id, "Hi", 12,
                                    q => {
                                        this.assertAreEqual(q, 20, testFail);
                                        success();
                                    });
                            }
                        });
                    });
                });
            });
        });
    }
    public TestAllPoolResponse(success: () => void, testFail: (reason: string) => void): void {
        const poolName = Utils.guid();
        this.BuildClient(manager1 => {
            manager1.OnReady(() => {
                manager1.JoinPool(poolName).OnMessage((from, message, respond) => {
                    this.assertAreEqual(message.Method, "Bar", testFail);
                    this.assertAreEqual(message.GetJson<number>(), 13, testFail);
                    respond(14);
                });
                this.BuildClient(manager2 => {
                    manager2.OnReady(() => {
                        manager2.JoinPool(poolName).OnMessage((from, message, respond) => {
                            this.assertAreEqual(message.Method, "Bar", testFail);
                            this.assertAreEqual(message.GetJson<number>(), 13, testFail);
                            respond(14);
                        });
                        this.BuildClient(manager3 => {
                            manager3.OnReady(() => {
                                manager3.OnPoolUpdated(poolName, (clients) => {
                                    if (clients.length === 2) {
                                        let countHit = 0;
                                        manager3.SendAllPoolMessage<number>(poolName, "Bar", 13, m => {
                                            this.assertAreEqual(m, 14, testFail);
                                            countHit++;
                                            if (countHit == 2)
                                                success();
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
    public Test100ClientsAll(success: () => void, testFail: (reason: string) => void): void {
        const poolName = Utils.guid();
        const total = 100;
        for (let i = 0; i < total; i++) {
            this.BuildClient(manager => {
                manager.OnReady(() => {
                    manager.JoinPool(poolName).OnMessage((from, message, respond) => {
                        this.assertAreEqual(message.Method, "Bar", testFail);
                        this.assertAreEqual(message.GetJson<number>(), 13, testFail);
                        respond(14);
                    });
                });
            });
        }
        this.BuildClient(manager => {
            manager.OnReady(() => {
                manager.OnPoolUpdated(poolName, (clients) => {
                    if (clients.length === total) {
                        let countHit = 0;
                        manager.SendAllPoolMessage<number>(poolName, "Bar", 13, m => {
                            this.assertAreEqual(m, 14, testFail);
                            countHit++;
                            if (countHit == 100)
                                success();
                        });
                    }
                });
            });
        });
    }
    public TestEveryone(success: () => void, testFail: (reason: string) => void): void {
        const total = 50;
        this.BuildClient(manager => {
            manager.OnReady(() => {
                manager.OnPoolUpdated("Everyone", (clients) => {
                    if (clients.length === 1) {
                        for (let i = 0; i < total; i++) {
                            this.BuildClient(m => {

                            });
                        }
                    }
                    else if (clients.length === total) {
                        success();
                    }
                });
            });
        });
    }
    public TestSlammer(success: () => void, testFail: (reason: string) => void): void {
        console.log("Started Slammer");
        const poolName = Utils.guid();
        const total = 10;
        for (let i = 0; i < total; i++) {
            this.BuildClient(manager => {
                manager.OnReady(() => {
                    manager.JoinPool(poolName).OnMessage((from, message, respond) => {
                        this.assertAreEqual(message.Method, "Bar", testFail);
                        this.assertAreEqual(message.GetJson<number>(), 13, testFail);
                        respond(14);
                    });
                });
            });
        }
        this.BuildClient(manager => {
            manager.OnReady(() => {
                manager.OnPoolUpdated(poolName, (clients) => {
                    if (clients.length === total) {
                        let exec: () => void = null;
                        exec = () => {
                            manager.SendPoolMessage<number>(poolName, "Bar", 13, m => {
                                this.assertAreEqual(m, 14, testFail);
                                exec();
                            });
                        };
                        exec();
                    }
                });
            });
        });
    }
    private BuildClient(ready: (_: OnPoolClient) => void): void {
        const c = new OnPoolClient();
        this.connectedClients.push(c);
        c.ConnectToServer("127.0.0.1");
        ready(c);
    }
    public CleanupTest(): void {
        for (let i = 0; i < this.connectedClients.length; i++) {
            const client = this.connectedClients[i];
            client.Disconnect();
        }
        this.connectedClients = [];
    }



    run(test: (testPass: () => void, testFail: (reason: string) => void) => void): Promise<void> {
        return new Promise<void>((res, rej) => {
            test.call(this,
                () => {
                    console.log('test passed ' + test.name);
                    this.CleanupTest();
                    res();
                },
                (reason: string) =>
                    rej(reason)
            );
        });
    }
}
export class Payload {
    public Foo: string;
    public Bar: string;
}