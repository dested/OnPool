"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var clientPool_1 = require("./clientPool");
var clientConnection_1 = require("./common/clientConnection");
var query_1 = require("./common/query");
var ClientBrokerManager = (function () {
    function ClientBrokerManager() {
        this.pools = [];
        this.onReady = [];
        this.onDisconnect = [];
        this.onMessage = [];
        this.onMessageWithResponse = [];
    }
    Object.defineProperty(ClientBrokerManager.prototype, "MySwimmerId", {
        get: function () {
            return this.client.Id;
        },
        enumerable: true,
        configurable: true
    });
    ClientBrokerManager.prototype.ConnectToBroker = function (ip) {
        var _this = this;
        this.client = new clientConnection_1.ClientConnection("127.0.0.1");
        this.client.OnMessage.push(function (from, message) { return _this.onReceiveMessage(from, message); });
        this.client.OnMessageWithResponse.push(function (from, message, respond) { return _this.onReceiveMessageWithResponse(from, message, respond); });
        this.client.OnDisconnect.push(function (_) { return _this.invokeDisconnect(); });
        this.client.StartFromClient();
        this.GetSwimmerId(function (id) {
            _this.client.Id = id;
            _this.invokeReady();
        });
    };
    ClientBrokerManager.prototype.OnReady = function (callback) {
        this.onReady.push(callback);
    };
    ClientBrokerManager.prototype.OnDisconnect = function (callback) {
        this.onDisconnect.push(callback);
    };
    ClientBrokerManager.prototype.OnMessage = function (call) {
        this.onMessage.push(call);
    };
    ClientBrokerManager.prototype.OnMessageWithResponse = function (callback) {
        this.onMessageWithResponse.push(callback);
    };
    ClientBrokerManager.prototype.onReceiveMessageWithResponse = function (from, message, respond) {
        if (message.Contains("~ToSwimmer~")) {
            this.invokeMessageWithResponse(from, message, respond);
            return;
        }
        if (message.Contains("~ToPool~")) {
            var pool = this.pools.filter(function (a) { return a.PoolName == message.get("~ToPool~"); })[0];
            pool && pool.invokeMessageWithResponse(from, message, respond);
            return;
        }
        if (message.Contains("~ToPoolAll~")) {
            var pool = this.pools.filter(function (a) { return a.PoolName == message.get("~ToPoolAll~"); })[0];
            pool &&
                pool.invokeMessageWithResponse(from, message, function (res) {
                    res.Add("~PoolAllCount~", message.get("~PoolAllCount~"));
                    respond(res);
                });
            return;
        }
    };
    ClientBrokerManager.prototype.onReceiveMessage = function (from, message) {
        if (message.Contains("~ToSwimmer~")) {
            this.invokeMessage(from, message);
            return;
        }
        if (message.Contains("~ToPool~")) {
            var pool = this.pools.filter(function (a) { return a.PoolName == message.get("~ToPool~"); })[0];
            pool && pool.invokeMessage(from, message);
            return;
        }
        if (message.Contains("~ToPoolAll~")) {
            var pool = this.pools.filter(function (a) { return a.PoolName == message.get("~ToPoolAll~"); })[0];
            pool && pool.invokeMessage(from, message);
            return;
        }
    };
    ClientBrokerManager.prototype.GetSwimmerId = function (callback) {
        var query = query_1.Query.Build("GetSwimmerId");
        this.client.SendMessageWithResponse(query, function (response) {
            callback(response.GetJson());
        });
    };
    ClientBrokerManager.prototype.SendMessage = function (swimmerId, query) {
        query.Add("~ToSwimmer~", swimmerId);
        this.client.SendMessage(query);
    };
    ClientBrokerManager.prototype.SendMessageWithResponse = function (swimmerId, query, callback) {
        query.Add("~ToSwimmer~", swimmerId);
        this.client.SendMessageWithResponse(query, function (response) {
            callback(response.GetJson());
        });
    };
    ClientBrokerManager.prototype.GetPool = function (poolName, callback) {
        var _this = this;
        var query = query_1.Query.Build("GetPool", new query_1.QueryParam("PoolName", poolName));
        this.client.SendMessageWithResponse(query, function (response) {
            var getPoolByNameResponse = response.GetJson();
            var pool = _this.pools.filter(function (a) { return a.PoolName == getPoolByNameResponse.PoolName; })[0];
            if (pool == null) {
                _this.pools.push(pool = new clientPool_1.ClientPool(_this, getPoolByNameResponse));
            }
            pool.PoolName = getPoolByNameResponse.PoolName;
            callback(pool);
        });
    };
    ClientBrokerManager.prototype.GetAllPools = function (poolName, callback) {
        var query = query_1.Query.Build("GetAllPools");
        this.client.SendMessageWithResponse(query, function (response) {
            callback(response.GetJson());
        });
    };
    ClientBrokerManager.prototype.Disconnet = function () {
        this.client.ForceDisconnect();
    };
    ClientBrokerManager.prototype.invokeMessageWithResponse = function (from, message, respond) {
        for (var i = 0; i < this.onMessageWithResponse.length; i++) {
            this.onMessageWithResponse[i](from, message, respond);
        }
    };
    ClientBrokerManager.prototype.invokeMessage = function (from, message) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](from, message);
        }
    };
    ClientBrokerManager.prototype.invokeDisconnect = function () {
        for (var i = 0; i < this.onDisconnect.length; i++) {
            this.onDisconnect[i]();
        }
    };
    ClientBrokerManager.prototype.invokeReady = function () {
        for (var i = 0; i < this.onReady.length; i++) {
            this.onReady[i]();
        }
    };
    return ClientBrokerManager;
}());
exports.ClientBrokerManager = ClientBrokerManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50QnJva2VyTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnRCcm9rZXJNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQXdDO0FBQ3hDLDhEQUE2RjtBQUM3Rix3Q0FBaUQ7QUFJakQ7SUFBQTtRQUNZLFVBQUssR0FBaUIsRUFBRSxDQUFDO1FBT3pCLFlBQU8sR0FBbUIsRUFBRSxDQUFDO1FBQzdCLGlCQUFZLEdBQW1CLEVBQUUsQ0FBQztRQUNsQyxjQUFTLEdBQWdCLEVBQUUsQ0FBQztRQUM1QiwwQkFBcUIsR0FBNEIsRUFBRSxDQUFDO0lBeUloRSxDQUFDO0lBaEpHLHNCQUFXLDRDQUFXO2FBQXRCO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQzFCLENBQUM7OztPQUFBO0lBT00sNkNBQWUsR0FBdEIsVUFBdUIsRUFBVTtRQUFqQyxpQkFXQztRQVZHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFJLEVBQUUsT0FBTyxJQUFLLE9BQUEsS0FBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsRUFBcEMsQ0FBb0MsQ0FBQyxDQUFDO1FBQ3BGLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLElBQUssT0FBQSxLQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBekQsQ0FBeUQsQ0FBQyxDQUFDO1FBQzlILElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxnQkFBZ0IsRUFB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