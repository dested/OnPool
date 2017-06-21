"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var clientBrokerManager_1 = require("./clientBrokerManager");
var query_1 = require("./common/query");
var Tests = (function () {
    function Tests() {
        this.clients = [];
    }
    Tests.prototype.assertAreEqual = function (a, b, testFail) {
        if (a === b) {
            return;
        }
        testFail("Assert Failed " + a + " " + b);
        throw "Assert Failed " + a + " " + b;
    };
    Tests.prototype.TestSwimmerResponse = function (testPass, testFail) {
        var _this = this;
        this.BuildClientManager(function (manager1) {
            manager1.OnMessageWithResponse(function (from, message, respond) {
                _this.assertAreEqual(message.Method, "Baz", testFail);
                _this.assertAreEqual(message.GetJson(), 12, testFail);
                respond(message.RespondWithJson("foo1"));
            });
            manager1.OnReady(function () {
                manager1.GetPool("TestPool", function (pool) {
                    pool.JoinPool(function () {
                        _this.BuildClientManager(function (manager2) {
                            manager2.OnMessageWithResponse(function (from, message, respond) {
                                _this.assertAreEqual(message.Method, "Baz", testFail);
                                _this.assertAreEqual(message.GetJson(), 13, testFail);
                                respond(message.RespondWithJson("foo2"));
                            });
                            manager2.OnReady(function () {
                                manager2.GetPool("TestPool", function (pool2) {
                                    pool2.JoinPool(function () {
                                        _this.BuildClientManager(function (manager3) {
                                            manager3.OnReady(function () {
                                                manager3.GetPool("TestPool", function (pool3) {
                                                    pool3.JoinPool(function () {
                                                        pool.GetSwimmers(function (swimmers) {
                                                            var count = 0;
                                                            swimmers[0].SendMessageWithResponse(query_1.Query.BuildWithJson("Baz", 12), function (q) {
                                                                count++;
                                                                _this.assertAreEqual(q.GetJson(), "foo1", testFail);
                                                                if (count === 2)
                                                                    testPass();
                                                            });
                                                            swimmers[1].SendMessageWithResponse(query_1.Query.BuildWithJson("Baz", 13), function (q) {
                                                                count++;
                                                                _this.assertAreEqual(q.GetJson(), "foo2", testFail);
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
    };
    Tests.prototype.TestPoolResponse = function (testPass, testFail) {
        var _this = this;
        this.BuildClientManager(function (manager1) {
            manager1.OnReady(function () {
                manager1.GetPool("TestPool", function (pool1) {
                    var poolHit = 0;
                    pool1.OnMessageWithResponse(function (from, message, respond) {
                        _this.assertAreEqual(message.Method, "Baz", testFail);
                        if (poolHit === 0) {
                            poolHit++;
                            _this.assertAreEqual(message.GetJson(), 12, testFail);
                            respond(message.RespondWithJson(13));
                        }
                        else {
                            _this.assertAreEqual(message.GetJson(), 14, testFail);
                            respond(message.RespondWithJson(15));
                        }
                    });
                    pool1.JoinPool(function () {
                        _this.BuildClientManager(function (manager2) {
                            manager2.OnReady(function () {
                                manager2.GetPool("TestPool", function (pool2) {
                                    pool2.JoinPool(function () {
                                        pool2.OnMessageWithResponse(function (from, message, respond) {
                                            _this.assertAreEqual(message.Method, "Bar", testFail);
                                            _this.assertAreEqual(message.GetJson(), 13, testFail);
                                            respond(message.RespondWithJson(14));
                                        });
                                        _this.BuildClientManager(function (manager3) {
                                            manager3.OnReady(function () {
                                                manager3.GetPool("TestPool", function (pool3) {
                                                    var countHit = 0;
                                                    pool3.SendMessageWithResponse(query_1.Query.BuildWithJson("Baz", 12), function (m) {
                                                        _this.assertAreEqual(m.GetJson(), 13, testFail);
                                                        countHit++;
                                                        if (countHit === 3)
                                                            testPass();
                                                    });
                                                    pool3.SendMessageWithResponse(query_1.Query.BuildWithJson("Bar", 13), function (m) {
                                                        _this.assertAreEqual(m.GetJson(), 14, testFail);
                                                        countHit++;
                                                        if (countHit === 3)
                                                            testPass();
                                                    });
                                                    pool3.SendMessageWithResponse(query_1.Query.BuildWithJson("Baz", 14), function (m) {
                                                        _this.assertAreEqual(m.GetJson(), 15, testFail);
                                                        countHit++;
                                                        if (countHit === 3)
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
    };
    Tests.prototype.TestDirectSwimmerResponse = function (testPass, testFail) {
        var _this = this;
        this.BuildClientManager(function (manager1) {
            manager1.OnReady(function () {
                manager1.OnMessageWithResponse(function (from, message, respond) {
                    _this.assertAreEqual(message.Method, "Hi", testFail);
                    _this.assertAreEqual(message.GetJson(), 12, testFail);
                    respond(message.RespondWithJson(20));
                });
                manager1.GetPool("TestPool", function (pool1) {
                    pool1.JoinPool(function () {
                        _this.BuildClientManager(function (manager2) {
                            manager2.OnReady(function () {
                                manager2.GetPool("TestPool", function (pool2) {
                                    pool1.GetSwimmers(function (swimmers) {
                                        var swim = swimmers[0];
                                        manager2.SendMessageWithResponse(swim.Id, query_1.Query.BuildWithJson("Hi", 12), function (q) {
                                            _this.assertAreEqual(q.GetJson(), 20, testFail);
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
    };
    Tests.prototype.TestAllPoolResponse = function (testPass, testFail) {
        var _this = this;
        this.BuildClientManager(function (manager1) {
            manager1.OnReady(function () {
                manager1.GetPool("TestPool", function (pool1) {
                    pool1.OnMessageWithResponse(function (from, message, respond) {
                        _this.assertAreEqual(message.Method, "Bar", testFail);
                        _this.assertAreEqual(message.GetJson(), 13, testFail);
                        respond(message.RespondWithJson(14));
                    });
                    pool1.JoinPool(function () {
                        _this.BuildClientManager(function (manager2) {
                            manager2.OnReady(function () {
                                manager2.GetPool("TestPool", function (pool2) {
                                    pool2.JoinPool(function () {
                                        pool2.OnMessageWithResponse(function (from, message, respond) {
                                            _this.assertAreEqual(message.Method, "Bar", testFail);
                                            _this.assertAreEqual(message.GetJson(), 13, testFail);
                                            respond(message.RespondWithJson(14));
                                        });
                                        _this.BuildClientManager(function (manager3) {
                                            manager3.OnReady(function () {
                                                manager3.GetPool("TestPool", function (pool3) {
                                                    var countHit = 0;
                                                    pool3.SendAllMessageWithResponse(query_1.Query.BuildWithJson("Bar", 13), function (m) {
                                                        _this.assertAreEqual(m.GetJson(), 14, testFail);
                                                        countHit++;
                                                        if (countHit === 2)
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
    };
    Tests.prototype.Test100ClientsAll = function (testPass, testFail) {
        var _this = this;
        for (var i = 0; i < 100; i++) {
            this.BuildClientManager(function (manager) {
                manager.OnReady(function () {
                    manager.GetPool("TestPool2", function (pool1) {
                        pool1.OnMessageWithResponse(function (from, message, respond) {
                            _this.assertAreEqual(message.Method, "Bar", testFail);
                            _this.assertAreEqual(message.GetJson(), 13, testFail);
                            respond(message.RespondWithJson(14));
                        });
                        pool1.JoinPool(function () {
                        });
                    });
                });
            });
        }
        this.BuildClientManager(function (manager) {
            manager.OnReady(function () {
                manager.GetPool("TestPool2", function (pool3) {
                    var countHit = 0;
                    pool3.SendAllMessageWithResponse(query_1.Query.BuildWithJson("Bar", 13), function (m) {
                        _this.assertAreEqual(m.GetJson(), 14, testFail);
                        countHit++;
                        console.log(countHit);
                        if (countHit === 100)
                            testPass();
                        ;
                    });
                });
            });
        });
    };
    Tests.prototype.TestSlammer = function (testPass, testFail) {
        var _this = this;
        for (var i = 0; i < 10; i++) {
            this.BuildClientManager(function (manager) {
                manager.OnReady(function () {
                    manager.GetPool("TestPool", function (pool1) {
                        pool1.OnMessageWithResponse(function (from, message, respond) {
                            _this.assertAreEqual(message.Method, "Bar", testFail);
                            _this.assertAreEqual(message.GetJson(), 13, testFail);
                            respond(message.RespondWithJson(14));
                        });
                        pool1.JoinPool(function () {
                        });
                    });
                });
            });
        }
        this.BuildClientManager(function (manager) {
            manager.OnReady(function () {
                manager.GetPool("TestPool", function (pool3) {
                    var exec = function () {
                        pool3.SendMessageWithResponse(query_1.Query.BuildWithJson("Bar", 13), function (m) {
                            _this.assertAreEqual(m.GetJson(), 14, testFail);
                            exec();
                        });
                    };
                    exec();
                });
            });
        });
    };
    Tests.prototype.BuildClientManager = function (ready) {
        var c = new clientBrokerManager_1.ClientBrokerManager();
        this.clients.push(c);
        c.ConnectToBroker("127.0.0.1");
        ready(c);
    };
    Tests.prototype.run = function (test) {
        var _this = this;
        return new Promise(function (res, rej) {
            test.call(_this, function () {
                console.log('test passed ' + test.name);
                for (var i = 0; i < _this.clients.length; i++) {
                    var client = _this.clients[i];
                    client.Disconnet();
                }
                _this.clients = [];
                res();
            }, function (reason) {
                return rej(reason);
            });
        });
    };
    return Tests;
}());
exports.Tests = Tests;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdGVzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSw2REFBNEQ7QUFDNUQsd0NBQXVDO0FBR3ZDO0lBQUE7UUFrVVksWUFBTyxHQUEwQixFQUFFLENBQUM7SUEwQmhELENBQUM7SUExVlcsOEJBQWMsR0FBdEIsVUFBMEIsQ0FBSSxFQUFFLENBQUksRUFBRSxRQUFrQztRQUNwRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNWLE1BQU0sQ0FBQztRQUNYLENBQUM7UUFDRCxRQUFRLENBQUMsbUJBQWlCLENBQUMsU0FBSSxDQUFHLENBQUMsQ0FBQztRQUNwQyxNQUFNLG1CQUFpQixDQUFDLFNBQUksQ0FBRyxDQUFDO0lBQ3BDLENBQUM7SUFFTSxtQ0FBbUIsR0FBMUIsVUFBMkIsUUFBb0IsRUFBRSxRQUFrQztRQUFuRixpQkE4REM7UUE3REcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQUMsUUFBUTtZQUM3QixRQUFRLENBQUMscUJBQXFCLENBQUMsVUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU87Z0JBQ2xELEtBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3JELEtBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBVSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDN0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQztZQUNILFFBQVEsQ0FBQyxPQUFPLENBQUM7Z0JBQ2IsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQ3ZCLFVBQUEsSUFBSTtvQkFDQSxJQUFJLENBQUMsUUFBUSxDQUFDO3dCQUNWLEtBQUksQ0FBQyxrQkFBa0IsQ0FB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