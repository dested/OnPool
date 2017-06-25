"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var onPoolClient_1 = require("./onPoolClient");
var utils_1 = require("./common/utils");
var Tests = (function () {
    function Tests() {
        this.connectedClients = [];
    }
    Tests.prototype.assertAreEqual = function (a, b, testFail) {
        if (a === b) {
            return;
        }
        testFail("Assert Failed " + a + " " + b);
        throw "Assert Failed " + a + " " + b;
    };
    Tests.prototype.TestLeavePool = function (success, testFail) {
        var _this = this;
        var poolName = utils_1.Utils.guid();
        var m2 = null;
        this.BuildClient(function (manager1) {
            manager1.OnReady(function () {
                var hitCount = 0;
                manager1.OnPoolUpdated(poolName, function (clients) {
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
                _this.BuildClient(function (manager2) {
                    m2 = manager2;
                    manager2.OnReady(function () {
                        manager2.JoinPool(poolName);
                    });
                });
            });
        });
    };
    Tests.prototype.TestOnPoolUpdatedResponse = function (success, testFail) {
        var _this = this;
        var poolName = utils_1.Utils.guid();
        this.BuildClient(function (manager1) {
            manager1.OnReady(function () {
                var hitCount = 0;
                manager1.OnPoolUpdated(poolName, function (clients) {
                    hitCount++;
                    if (hitCount === 4) {
                        success();
                    }
                });
                manager1.JoinPool(poolName);
                _this.BuildClient(function (manager2) {
                    manager2.OnReady(function () {
                        manager2.JoinPool(poolName);
                        _this.BuildClient(function (manager3) {
                            manager3.OnReady(function () {
                                manager3.JoinPool(poolName);
                            });
                        });
                    });
                });
            });
        });
    };
    Tests.prototype.TestOnPoolDisconnectedResponse = function (success, testFail) {
        var _this = this;
        var poolName = utils_1.Utils.guid();
        this.BuildClient(function (manager1) {
            manager1.OnReady(function () {
                var hitCount = 0;
                manager1.OnPoolUpdated(poolName, function (clients) {
                    if (clients.length === 0) {
                        hitCount++;
                        if (hitCount === 2) {
                            success();
                        }
                    }
                });
                _this.BuildClient(function (manager2) {
                    manager2.OnReady(function () {
                        manager2.JoinPool(poolName);
                        _this.BuildClient(function (manager3) {
                            manager3.OnReady(function () {
                                manager3.JoinPool(poolName);
                                _this.BuildClient(function (manager4) {
                                    manager4.OnReady(function () {
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
    };
    Tests.prototype.TestClientResponse = function (success, testFail) {
        var _this = this;
        var poolName = utils_1.Utils.guid();
        this.BuildClient(function (manager1) {
            manager1.OnMessage(function (from, message, respond) {
                _this.assertAreEqual(message.Method, "Baz", testFail);
                _this.assertAreEqual(message.GetJson(), 12, testFail);
                respond("foo1");
            });
            manager1.OnReady(function () {
                manager1.JoinPool(poolName);
                _this.BuildClient(function (manager2) {
                    manager2.OnMessage(function (from, message, respond) {
                        _this.assertAreEqual(message.Method, "Baz", testFail);
                        _this.assertAreEqual(message.GetJson(), 13, testFail);
                        respond("foo2");
                    });
                    manager2.OnReady(function () {
                        manager2.JoinPool(poolName);
                        _this.BuildClient(function (manager3) {
                            manager3.OnReady(function () {
                                manager3.JoinPool(poolName);
                                manager3.OnPoolUpdated(poolName, function (clients) {
                                    if (clients.length === 3) {
                                        var count_1 = 0;
                                        manager3.SendClientMessage(clients[0].Id, "Baz", 12, function (result) {
                                            count_1++;
                                            _this.assertAreEqual(result, "foo1", testFail);
                                            if (count_1 == 2)
                                                success();
                                        });
                                        manager3.SendClientMessage(clients[1].Id, "Baz", 13, function (result) {
                                            count_1++;
                                            _this.assertAreEqual(result, "foo2", testFail);
                                            if (count_1 == 2)
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
    };
    Tests.prototype.TestPoolResponse = function (success, testFail) {
        var _this = this;
        var poolHit = 0;
        var poolName = utils_1.Utils.guid();
        this.BuildClient(function (manager1) {
            manager1.OnReady(function () {
                manager1.JoinPool(poolName).OnMessage(function (from, message, respond) {
                    _this.assertAreEqual(message.Method, "Baz", testFail);
                    if (poolHit == 0) {
                        poolHit++;
                        _this.assertAreEqual(message.GetJson(), 12, testFail);
                        respond(13);
                    }
                    else {
                        _this.assertAreEqual(message.GetJson(), 14, testFail);
                        respond(15);
                    }
                });
                _this.BuildClient(function (manager2) {
                    manager2.OnReady(function () {
                        manager2.JoinPool(poolName).OnMessage(function (from, message, respond) {
                            _this.assertAreEqual(message.Method, "Bar", testFail);
                            _this.assertAreEqual(message.GetJson(), 13, testFail);
                            respond(14);
                        });
                        _this.BuildClient(function (manager3) {
                            manager3.OnReady(function () {
                                manager3.OnPoolUpdated(poolName, function (clients) {
                                    if (clients.length === 2) {
                                        var countHit_1 = 0;
                                        manager3.SendPoolMessage(poolName, "Baz", 12, function (m) {
                                            _this.assertAreEqual(m, 13, testFail);
                                            countHit_1++;
                                            if (countHit_1 == 3)
                                                success();
                                        });
                                        manager3.SendPoolMessage(poolName, "Bar", 13, function (m) {
                                            _this.assertAreEqual(m, 14, testFail);
                                            countHit_1++;
                                            if (countHit_1 == 3)
                                                success();
                                        });
                                        manager3.SendPoolMessage(poolName, "Baz", 14, function (m) {
                                            _this.assertAreEqual(m, 15, testFail);
                                            countHit_1++;
                                            if (countHit_1 == 3)
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
    };
    Tests.prototype.TestClientSendObject = function (success, testFail) {
        var _this = this;
        var poolName = utils_1.Utils.guid();
        this.BuildClient(function (manager1) {
            manager1.OnReady(function () {
                manager1.OnMessage(function (from, message, respond) {
                    _this.assertAreEqual(message.Method, "Hi", testFail);
                    var payload = message.GetJson();
                    _this.assertAreEqual(payload.Foo, "hello", testFail);
                    _this.assertAreEqual(payload.Bar, "Elido", testFail);
                    var p = new Payload();
                    p.Foo = "hi";
                    p.Bar = "ashley";
                    respond(p);
                });
                manager1.JoinPool(poolName);
                _this.BuildClient(function (manager2) {
                    manager2.OnReady(function () {
                        manager1.OnPoolUpdated(poolName, function (clients) {
                            if (clients.length === 1) {
                                var swim = clients[0];
                                var p = new Payload();
                                p.Foo = "hello";
                                p.Bar = "Elido";
                                manager2.SendClientMessage(swim.Id, "Hi", p, function (q) {
                                    _this.assertAreEqual(q.Foo, "hi", testFail);
                                    _this.assertAreEqual(q.Bar, "ashley", testFail);
                                    success();
                                });
                            }
                        });
                    });
                });
            });
        });
    };
    Tests.prototype.TestDirectClientResponse = function (success, testFail) {
        var _this = this;
        var poolName = utils_1.Utils.guid();
        this.BuildClient(function (manager1) {
            manager1.OnReady(function () {
                manager1.OnMessage(function (from, message, respond) {
                    _this.assertAreEqual(message.Method, "Hi", testFail);
                    _this.assertAreEqual(message.GetJson(), 12, testFail);
                    respond(20);
                });
                manager1.JoinPool(poolName);
                _this.BuildClient(function (manager2) {
                    manager2.OnReady(function () {
                        manager1.OnPoolUpdated(poolName, function (clients) {
                            if (clients.length === 1) {
                                var swim = clients[0];
                                manager2.SendClientMessage(swim.Id, "Hi", 12, function (q) {
                                    _this.assertAreEqual(q, 20, testFail);
                                    success();
                                });
                            }
                        });
                    });
                });
            });
        });
    };
    Tests.prototype.TestAllPoolResponse = function (success, testFail) {
        var _this = this;
        var poolName = utils_1.Utils.guid();
        this.BuildClient(function (manager1) {
            manager1.OnReady(function () {
                manager1.JoinPool(poolName).OnMessage(function (from, message, respond) {
                    _this.assertAreEqual(message.Method, "Bar", testFail);
                    _this.assertAreEqual(message.GetJson(), 13, testFail);
                    respond(14);
                });
                _this.BuildClient(function (manager2) {
                    manager2.OnReady(function () {
                        manager2.JoinPool(poolName).OnMessage(function (from, message, respond) {
                            _this.assertAreEqual(message.Method, "Bar", testFail);
                            _this.assertAreEqual(message.GetJson(), 13, testFail);
                            respond(14);
                        });
                        _this.BuildClient(function (manager3) {
                            manager3.OnReady(function () {
                                manager3.OnPoolUpdated(poolName, function (clients) {
                                    if (clients.length === 2) {
                                        var countHit_2 = 0;
                                        manager3.SendAllPoolMessage(poolName, "Bar", 13, function (m) {
                                            _this.assertAreEqual(m, 14, testFail);
                                            countHit_2++;
                                            if (countHit_2 == 2)
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
    };
    Tests.prototype.Test100ClientsAll = function (success, testFail) {
        var _this = this;
        var poolName = utils_1.Utils.guid();
        var total = 100;
        for (var i = 0; i < total; i++) {
            this.BuildClient(function (manager) {
                manager.OnReady(function () {
                    manager.JoinPool(poolName).OnMessage(function (from, message, respond) {
                        _this.assertAreEqual(message.Method, "Bar", testFail);
                        _this.assertAreEqual(message.GetJson(), 13, testFail);
                        respond(14);
                    });
                });
            });
        }
        this.BuildClient(function (manager) {
            manager.OnReady(function () {
                manager.OnPoolUpdated(poolName, function (clients) {
                    if (clients.length === total) {
                        var countHit_3 = 0;
                        manager.SendAllPoolMessage(poolName, "Bar", 13, function (m) {
                            _this.assertAreEqual(m, 14, testFail);
                            countHit_3++;
                            if (countHit_3 == 100)
                                success();
                        });
                    }
                });
            });
        });
    };
    Tests.prototype.TestEveryone = function (success, testFail) {
        var _this = this;
        var total = 50;
        this.BuildClient(function (manager) {
            manager.OnReady(function () {
                manager.OnPoolUpdated("Everyone", function (clients) {
                    if (clients.length === 1) {
                        for (var i = 0; i < total; i++) {
                            _this.BuildClient(function (m) {
                            });
                        }
                    }
                    else if (clients.length === total) {
                        success();
                    }
                });
            });
        });
    };
    Tests.prototype.TestSlammer = function (success, testFail) {
        var _this = this;
        console.log("Started Slammer");
        var poolName = utils_1.Utils.guid();
        var total = 10;
        for (var i = 0; i < total; i++) {
            this.BuildClient(function (manager) {
                manager.OnReady(function () {
                    manager.JoinPool(poolName).OnMessage(function (from, message, respond) {
                        _this.assertAreEqual(message.Method, "Bar", testFail);
                        _this.assertAreEqual(message.GetJson(), 13, testFail);
                        respond(14);
                    });
                });
            });
        }
        this.BuildClient(function (manager) {
            manager.OnReady(function () {
                manager.OnPoolUpdated(poolName, function (clients) {
                    if (clients.length === total) {
                        var exec_1 = null;
                        exec_1 = function () {
                            manager.SendPoolMessage(poolName, "Bar", 13, function (m) {
                                _this.assertAreEqual(m, 14, testFail);
                                exec_1();
                            });
                        };
                        exec_1();
                    }
                });
            });
        });
    };
    Tests.prototype.BuildClient = function (ready) {
        var c = new onPoolClient_1.OnPoolClient();
        this.connectedClients.push(c);
        c.ConnectToServer("127.0.0.1");
        ready(c);
    };
    Tests.prototype.CleanupTest = function () {
        for (var i = 0; i < this.connectedClients.length; i++) {
            var client = this.connectedClients[i];
            client.Disconnect();
        }
        this.connectedClients = [];
    };
    Tests.prototype.run = function (test) {
        var _this = this;
        return new Promise(function (res, rej) {
            test.call(_this, function () {
                console.log('test passed ' + test.name);
                _this.CleanupTest();
                res();
            }, function (reason) {
                return rej(reason);
            });
        });
    };
    return Tests;
}());
exports.Tests = Tests;
var Payload = (function () {
    function Payload() {
    }
    return Payload;
}());
exports.Payload = Payload;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdGVzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSwrQ0FBOEM7QUFDOUMsd0NBQXVDO0FBRXZDO0lBQUE7UUFVWSxxQkFBZ0IsR0FBbUIsRUFBRSxDQUFDO0lBb1psRCxDQUFDO0lBNVpXLDhCQUFjLEdBQXRCLFVBQTBCLENBQUksRUFBRSxDQUFJLEVBQUUsUUFBa0M7UUFDcEUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDVixNQUFNLENBQUM7UUFDWCxDQUFDO1FBQ0QsUUFBUSxDQUFDLG1CQUFpQixDQUFDLFNBQUksQ0FBRyxDQUFDLENBQUM7UUFDcEMsTUFBTSxtQkFBaUIsQ0FBQyxTQUFJLENBQUcsQ0FBQztJQUNwQyxDQUFDO0lBR00sNkJBQWEsR0FBcEIsVUFBcUIsT0FBbUIsRUFBRSxRQUFrQztRQUE1RSxpQkEwQkM7UUF6QkcsSUFBTSxRQUFRLEdBQUcsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzlCLElBQUksRUFBRSxHQUFpQixJQUFJLENBQUM7UUFDNUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFBLFFBQVE7WUFDckIsUUFBUSxDQUFDLE9BQU8sQ0FBQztnQkFDYixJQUFJLFFBQVEsR0FBVyxDQUFDLENBQUM7Z0JBQ3pCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLFVBQUMsT0FBTztvQkFDckMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN2QixRQUFRLEVBQUUsQ0FBQzt3QkFDWCxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDakIsT0FBTyxFQUFFLENBQUM7d0JBQ2QsQ0FBQztvQkFDTCxDQUFDO29CQUNELElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJ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