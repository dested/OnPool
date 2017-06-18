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
        this.client.OnMessage.push(function (_, message) { return _this.onReceiveMessage(message); });
        this.client.OnMessageWithResponse.push(function (_, message, respond) { return _this.onReceiveMessageWithResponse(message, respond); });
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
    ClientBrokerManager.prototype.onReceiveMessageWithResponse = function (query, respond) {
        if (query.Contains("~ToSwimmer~")) {
            this.invokeMessageWithResponse(query, respond);
            return;
        }
        if (query.Contains("~ToPool~")) {
            var pool = this.pools.filter(function (a) { return a.PoolName == query.get("~ToPool~"); })[0];
            pool && pool.invokeMessageWithResponse(query, respond);
            return;
        }
        if (query.Contains("~ToPoolAll~")) {
            var pool = this.pools.filter(function (a) { return a.PoolName == query.get("~ToPoolAll~"); })[0];
            pool &&
                pool.invokeMessageWithResponse(query, function (res) {
                    res.Add("~PoolAllCount~", query.get("~PoolAllCount~"));
                    respond(res);
                });
            return;
        }
    };
    ClientBrokerManager.prototype.onReceiveMessage = function (query) {
        if (query.Contains("~ToSwimmer~")) {
            this.invokeMessage(query);
            return;
        }
        if (query.Contains("~ToPool~")) {
            var pool = this.pools.filter(function (a) { return a.PoolName == query.get("~ToPool~"); })[0];
            pool && pool.invokeMessage(query);
            return;
        }
        if (query.Contains("~ToPoolAll~")) {
            var pool = this.pools.filter(function (a) { return a.PoolName == query.get("~ToPoolAll~"); })[0];
            pool && pool.invokeMessage(query);
            return;
        }
    };
    ClientBrokerManager.prototype.GetSwimmerId = function (callback) {
        var query = query_1.Query.Build("GetSwimmerId");
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
            pool.NumberOfSwimmers = getPoolByNameResponse.NumberOfSwimmers;
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
    ClientBrokerManager.prototype.invokeMessageWithResponse = function (query, respond) {
        for (var i = 0; i < this.onMessageWithResponse.length; i++) {
            this.onMessageWithResponse[i](query, respond);
        }
    };
    ClientBrokerManager.prototype.invokeMessage = function (query) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](query);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50QnJva2VyTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnRCcm9rZXJNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTBDO0FBQzFDLDhEQUE2RDtBQUM3RCx3Q0FBbUQ7QUFJbkQ7SUFBQTtRQUNZLFVBQUssR0FBaUIsRUFBRSxDQUFDO1FBT3pCLFlBQU8sR0FBbUIsRUFBRSxDQUFDO1FBQzdCLGlCQUFZLEdBQW1CLEVBQUUsQ0FBQztRQUNsQyxjQUFTLEdBQStCLEVBQUUsQ0FBQztRQUMzQywwQkFBcUIsR0FBaUUsRUFBRSxDQUFDO0lBZ0lyRyxDQUFDO0lBdklHLHNCQUFXLDRDQUFXO2FBQXRCO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQzFCLENBQUM7OztPQUFBO0lBT00sNkNBQWUsR0FBdEIsVUFBdUIsRUFBVTtRQUFqQyxpQkFXQztRQVZHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsT0FBTyxJQUFLLE9BQUEsS0FBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxFQUE5QixDQUE4QixDQUFDLENBQUM7UUFDM0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sSUFBSyxPQUFBLEtBQUksQ0FBQyw0QkFBNEIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQW5ELENBQW1ELENBQUMsQ0FBQztRQUNySCxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBdkIsQ0FBdUIsQ0FBQyxD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