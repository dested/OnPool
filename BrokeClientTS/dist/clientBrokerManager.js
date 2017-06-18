"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var clientPool_1 = require("./clientPool");
var query_1 = require("./common/query");
var socketLayer_1 = require("./common/socketLayer");
var swimmer_1 = require("./swimmer");
var ClientBrokerManager = (function () {
    function ClientBrokerManager() {
        this.pools = [];
        this.swimmers = [];
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
        this.client = new socketLayer_1.SocketLayer("127.0.0.1", function (swimmerId) { return _this.getSwimmerById(swimmerId); });
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
            callback(response);
        });
    };
    ClientBrokerManager.prototype.GetPool = function (poolName, callback) {
        var _this = this;
        var query = query_1.Query.Build("GetPool", new query_1.QueryParam("PoolName", poolName));
        this.client.SendMessageWithResponse(query, function (response) {
            var getPoolByNameResponse = response.GetJson();
            var pool = _this.pools.filter(function (a) { return a.PoolName == getPoolByNameResponse.PoolName; })[0];
            if (pool == null) {
                _this.pools.push(pool = new clientPool_1.ClientPool(_this, getPoolByNameResponse, function (swimmerId) { return _this.getSwimmerById(swimmerId); }));
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
    ClientBrokerManager.prototype.getSwimmerById = function (swimmerId) {
        var swimmer = this.swimmers.filter(function (a) { return a.Id == swimmerId; })[0];
        if (swimmer == null) {
            swimmer = new swimmer_1.Swimmer(this.client, swimmerId);
            this.swimmers.push(swimmer);
        }
        return swimmer;
    };
    return ClientBrokerManager;
}());
exports.ClientBrokerManager = ClientBrokerManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50QnJva2VyTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnRCcm9rZXJNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQXdDO0FBQ3hDLHdDQUFpRDtBQUdqRCxvREFBbUY7QUFDbkYscUNBQWtDO0FBRWxDO0lBQUE7UUFDWSxVQUFLLEdBQWlCLEVBQUUsQ0FBQztRQUN6QixhQUFRLEdBQVksRUFBRSxDQUFDO1FBT3ZCLFlBQU8sR0FBbUIsRUFBRSxDQUFDO1FBQzdCLGlCQUFZLEdBQW1CLEVBQUUsQ0FBQztRQUNsQyxjQUFTLEdBQWdCLEVBQUUsQ0FBQztRQUM1QiwwQkFBcUIsR0FBNEIsRUFBRSxDQUFDO0lBaUpoRSxDQUFDO0lBeEpHLHNCQUFXLDRDQUFXO2FBQXRCO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQzFCLENBQUM7OztPQUFBO0lBT00sNkNBQWUsR0FBdEIsVUFBdUIsRUFBVTtRQUFqQyxpQkFXQztRQVZHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFdBQVcsRUFBRSxVQUFDLFNBQVMsSUFBSyxPQUFBLEtBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLEVBQTlCLENBQThCLENBQUMsQ0FBQztRQUMxRixJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFJLEVBQUUsT0FBTyxJQUFLLE9BQUEsS0FBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsRUFBcEMsQ0FBb0MsQ0FBQyxDQUFDO1FBQ3BGLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLElBQUssT0FBQSxLQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFB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