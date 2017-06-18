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
            manager1.OnMessageWithResponse(function (query, respond) {
                _this.assertAreEqual(query.Method, "Baz", testFail);
                _this.assertAreEqual(query.GetJson(), 12, testFail);
                respond(query.RespondWithJson("foo1"));
            });
            manager1.OnReady(function () {
                manager1.GetPool("GameServers", function (pool) {
                    pool.JoinPool(function () {
                        _this.BuildClientManager(function (manager2) {
                            manager2.OnMessageWithResponse(function (query, respond) {
                                _this.assertAreEqual(query.Method, "Baz", testFail);
                                _this.assertAreEqual(query.GetJson(), 13, testFail);
                                respond(query.RespondWithJson("foo2"));
                            });
                            manager2.OnReady(function () {
                                manager2.GetPool("GameServers", function (pool2) {
                                    pool2.JoinPool(function () {
                                        _this.BuildClientManager(function (manager3) {
                                            manager3.OnReady(function () {
                                                manager3.GetPool("GameServers", function (pool3) {
                                                    pool3.JoinPool(function () {
                                                        pool.GetSwimmers(function (swimmers) {
                                                            var count = 0;
                                                            swimmers[0].SendMessageWithResponse(query_1.Query.BuildWithJson("Baz", 12), function (q) {
                                                                count++;
                                                                _this.assertAreEqual(q, "foo1", testFail);
                                                                if (count === 2)
                                                                    testPass();
                                                            });
                                                            swimmers[1].SendMessageWithResponse(query_1.Query.BuildWithJson("Baz", 13), function (q) {
                                                                count++;
                                                                _this.assertAreEqual(q, "foo2", testFail);
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
                manager1.GetPool("GameServers", function (pool1) {
                    var poolHit = 0;
                    pool1.OnMessageWithResponse(function (q, respond) {
                        _this.assertAreEqual(q.Method, "Baz", testFail);
                        if (poolHit === 0) {
                            poolHit++;
                            _this.assertAreEqual(q.GetJson(), 12, testFail);
                            respond(q.RespondWithJson(13));
                        }
                        else {
                            _this.assertAreEqual(q.GetJson(), 14, testFail);
                            respond(q.RespondWithJson(15));
                        }
                    });
                    pool1.JoinPool(function () {
                        _this.BuildClientManager(function (manager2) {
                            manager2.OnReady(function () {
                                manager2.GetPool("GameServers", function (pool2) {
                                    pool2.JoinPool(function () {
                                        pool2.OnMessageWithResponse(function (q, respond) {
                                            _this.assertAreEqual(q.Method, "Bar", testFail);
                                            _this.assertAreEqual(q.GetJson(), 13, testFail);
                                            respond(q.RespondWithJson(14));
                                        });
                                        _this.BuildClientManager(function (manager3) {
                                            manager3.OnReady(function () {
                                                manager3.GetPool("GameServers", function (pool3) {
                                                    var countHit = 0;
                                                    pool3.SendMessageWithResponse(query_1.Query.BuildWithJson("Baz", 12), function (m) {
                                                        _this.assertAreEqual(m, 13, testFail);
                                                        countHit++;
                                                        if (countHit === 3)
                                                            testPass();
                                                    });
                                                    pool3.SendMessageWithResponse(query_1.Query.BuildWithJson("Bar", 13), function (m) {
                                                        _this.assertAreEqual(m, 14, testFail);
                                                        countHit++;
                                                        if (countHit === 3)
                                                            testPass();
                                                    });
                                                    pool3.SendMessageWithResponse(query_1.Query.BuildWithJson("Baz", 14), function (m) {
                                                        _this.assertAreEqual(m, 15, testFail);
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
    Tests.prototype.TestAllPoolResponse = function (testPass, testFail) {
        var _this = this;
        this.BuildClientManager(function (manager1) {
            manager1.OnReady(function () {
                manager1.GetPool("GameServers", function (pool1) {
                    pool1.OnMessageWithResponse(function (q, respond) {
                        _this.assertAreEqual(q.Method, "Bar", testFail);
                        _this.assertAreEqual(q.GetJson(), 13, testFail);
                        respond(q.RespondWithJson(14));
                    });
                    pool1.JoinPool(function () {
                        _this.BuildClientManager(function (manager2) {
                            manager2.OnReady(function () {
                                manager2.GetPool("GameServers", function (pool2) {
                                    pool2.JoinPool(function () {
                                        pool2.OnMessageWithResponse(function (q, respond) {
                                            _this.assertAreEqual(q.Method, "Bar", testFail);
                                            _this.assertAreEqual(q.GetJson(), 13, testFail);
                                            respond(q.RespondWithJson(14));
                                        });
                                        _this.BuildClientManager(function (manager3) {
                                            manager3.OnReady(function () {
                                                manager3.GetPool("GameServers", function (pool3) {
                                                    var countHit = 0;
                                                    pool3.SendAllMessageWithResponse(query_1.Query.BuildWithJson("Bar", 13), function (m) {
                                                        _this.assertAreEqual(m, 14, testFail);
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
                    manager.GetPool("GameServers", function (pool1) {
                        pool1.OnMessageWithResponse(function (q, respond) {
                            _this.assertAreEqual(q.Method, "Bar", testFail);
                            _this.assertAreEqual(q.GetJson(), 13, testFail);
                            respond(q.RespondWithJson(14));
                        });
                        pool1.JoinPool(function () {
                        });
                    });
                });
            });
        }
        this.BuildClientManager(function (manager) {
            manager.OnReady(function () {
                manager.GetPool("GameServers", function (pool3) {
                    var countHit = 0;
                    pool3.SendAllMessageWithResponse(query_1.Query.BuildWithJson("Bar", 13), function (m) {
                        _this.assertAreEqual(m, 14, testFail);
                        countHit++;
                        if (countHit === 100)
                            testPass();
                        ;
                    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdGVzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSw2REFBNEQ7QUFDNUQsd0NBQXVDO0FBR3ZDO0lBQUE7UUE2T1ksWUFBTyxHQUEwQixFQUFFLENBQUM7SUEwQmhELENBQUM7SUFyUVcsOEJBQWMsR0FBdEIsVUFBMEIsQ0FBSSxFQUFFLENBQUksRUFBRSxRQUFrQztRQUNwRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNWLE1BQU0sQ0FBQztRQUNYLENBQUM7UUFDRCxRQUFRLENBQUMsbUJBQWlCLENBQUMsU0FBSSxDQUFHLENBQUMsQ0FBQztRQUNwQyxNQUFNLG1CQUFpQixDQUFDLFNBQUksQ0FBRyxDQUFDO0lBQ3BDLENBQUM7SUFFTSxtQ0FBbUIsR0FBMUIsVUFBMkIsUUFBb0IsRUFBRSxRQUFrQztRQUFuRixpQkE4REM7UUE3REcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQUMsUUFBUTtZQUM3QixRQUFRLENBQUMscUJBQXFCLENBQUMsVUFBQyxLQUFLLEVBQUUsT0FBTztnQkFDMUMsS0FBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDbkQsS0FBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFVLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMzRCxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzNDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxDQUFDLE9BQU8sQ0FBQztnQkFDYixRQUFRLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFDMUIsVUFBQSxJQUFJO29CQUNBLElBQUksQ0FBQyxRQUFRLENBQUM7d0JBQ1YsS0FBSSxDQUFDLGtCQUFrQixDQUFDLFVBQUMsUUFB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