"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var query_1 = require("./common/query");
var pool_1 = require("./pool");
var socketManager_1 = require("./common/socketManager");
var utils_1 = require("./common/utils");
var OnPoolClient = (function () {
    function OnPoolClient() {
        this.pools = [];
        this.clients = [];
        this.poolAllCounter = {};
        this.messageResponses = {};
        this.onReady = [];
        this.onDisconnect = [];
        this.onMessage = [];
    }
    Object.defineProperty(OnPoolClient.prototype, "MySwimmerId", {
        get: function () {
            return this.socketManager.Id;
        },
        enumerable: true,
        configurable: true
    });
    OnPoolClient.prototype.ConnectToServer = function (ip) {
        var _this = this;
        this.socketManager = new socketManager_1.SocketManager(ip);
        this.socketManager.onReceive = function (from, query) { return _this.messageProcess(query); };
        this.socketManager.OnDisconnect.push(function (_) { return _this.invokeDisconnect(); });
        this.socketManager.StartFromClient();
        this.GetClientId(function (id) {
            _this.socketManager.Id = id;
            _this.invokeReady();
        });
    };
    OnPoolClient.prototype.messageProcess = function (message) {
        var _this = this;
        var fromClient;
        if (message.From != null)
            fromClient = this.GetClientById(message.From);
        else
            fromClient = this.GetClientById(this.socketManager.Id);
        switch (message.Direction) {
            case query_1.QueryDirection.Request:
                var receiptId_1 = message.RequestKey;
                this.onReceiveMessage(fromClient, message, function (queryResponse) {
                    var q = new query_1.Query();
                    q.Method = message.Method;
                    q.Direction = query_1.QueryDirection.Response;
                    q.Type = message.Type;
                    q.AddJson(queryResponse);
                    q.ResponseOptions = message.ResponseOptions;
                    q.To = fromClient.Id;
                    q.RequestKey = receiptId_1;
                    if (message.PoolAllCount > -1) {
                        q.PoolAllCount = message.PoolAllCount;
                    }
                    _this.socketManager.SendMessage(q);
                });
                break;
            case query_1.QueryDirection.Response:
                if (this.messageResponses[message.RequestKey]) {
                    var callback = this.messageResponses[message.RequestKey];
                    if (message.ResponseOptions === query_1.ResponseOptions.SingleResponse) {
                        if (message.PoolAllCount > -1) {
                            if (!this.poolAllCounter[message.RequestKey])
                                this.poolAllCounter[message.RequestKey] = 1;
                            else
                                this.poolAllCounter[message.RequestKey] = this.poolAllCounter[message.RequestKey] + 1;
                            if (this.poolAllCounter[message.RequestKey] === message.PoolAllCount) {
                                delete this.messageResponses[message.RequestKey];
                                delete this.poolAllCounter[message.RequestKey];
                            }
                        }
                        else {
                            delete this.messageResponses[message.RequestKey];
                        }
                    }
                    callback && callback(message);
                }
                else {
                    throw "Cannot find response callback";
                }
                break;
            default:
                throw "Direction not found";
        }
    };
    OnPoolClient.prototype.onReceiveMessage = function (from, query, respond) {
        switch (query.Type) {
            case query_1.QueryType.Client:
                this.invokeMessage(from, query, respond);
                return;
            case query_1.QueryType.Pool:
                {
                    var pool = this.pools.filter(function (a) { return a.PoolName === query.To; })[0];
                    pool && pool.ReceiveMessage(from, query, respond);
                    return;
                }
            case query_1.QueryType.PoolAll:
                {
                    var pool = this.pools.filter(function (a) { return a.PoolName === query.To; })[0];
                    pool && pool.ReceiveMessage(from, query, respond);
                }
                break;
            default:
                throw "Type not found: " + query;
        }
    };
    OnPoolClient.prototype.GetClientById = function (id) {
        var client = this.clients.filter(function (a) { return a.Id == id; })[0];
        if (!client) {
            client = new pool_1.Client(id);
            this.clients.push(client);
        }
        return client;
    };
    OnPoolClient.prototype.OnReady = function (callback) {
        this.onReady.push(callback);
    };
    OnPoolClient.prototype.OnDisconnect = function (callback) {
        this.onDisconnect.push(callback);
    };
    OnPoolClient.prototype.OnMessage = function (callback) {
        this.onMessage.push(callback);
    };
    OnPoolClient.prototype.GetClientId = function (callback) {
        var query = query_1.Query.BuildServerRequest("GetClientId");
        this.sendMessage(query, callback);
    };
    OnPoolClient.prototype.GetAllPools = function (poolName, callback) {
        var query = query_1.Query.BuildServerRequest("GetAllPools");
        this.sendMessage(query, callback);
    };
    OnPoolClient.prototype.OnPoolUpdated = function (poolName, callback) {
        var _this = this;
        var query = query_1.Query.BuildServerRequest("OnPoolUpdated", query_1.ResponseOptions.OpenResponse);
        query.AddJson(poolName);
        this.sendMessage(query, function (response) {
            callback(response.Clients.map(function (a) { return _this.GetClientById(a.Id); }));
        });
    };
    OnPoolClient.prototype.GetClients = function (poolName, callback) {
        var _this = this;
        var query = query_1.Query.BuildServerRequest("GetClients");
        query.AddJson(poolName);
        this.sendMessage(query, function (response) {
            callback(response.Clients.map(function (a) { return _this.GetClientById(a.Id); }));
        });
    };
    OnPoolClient.prototype.JoinPool = function (poolName) {
        var pool = new pool_1.Pool(poolName);
        this.pools.push(pool);
        var query = query_1.Query.BuildServerRequest("JoinPool");
        query.AddJson(poolName);
        this.sendMessage(query);
        return pool;
    };
    OnPoolClient.prototype.LeavePool = function (poolName) {
        var _this = this;
        var query = query_1.Query.BuildServerRequest("LeavePool");
        query.AddJson(poolName);
        this.sendMessage(query, function (response) {
            for (var i = _this.pools.length - 1; i >= 0; i--) {
                var pool = _this.pools[i];
                if (pool.PoolName === poolName) {
                    _this.pools.splice(i, 1);
                }
            }
        });
    };
    OnPoolClient.prototype.SendClientMessage = function (clientId, method, payload, callback, responseOptions) {
        if (callback === void 0) { callback = null; }
        if (responseOptions === void 0) { responseOptions = query_1.ResponseOptions.SingleResponse; }
        var q = new query_1.Query();
        q.Method = method;
        q.Direction = query_1.QueryDirection.Request;
        q.Type = query_1.QueryType.Client;
        q.To = clientId;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        q.Type = query_1.QueryType.Client;
        this.sendMessage(q, callback);
    };
    OnPoolClient.prototype.SendPoolMessage = function (poolName, method, payload, callback, responseOptions) {
        if (callback === void 0) { callback = null; }
        if (responseOptions === void 0) { responseOptions = query_1.ResponseOptions.SingleResponse; }
        var q = new query_1.Query();
        q.Method = method;
        q.Direction = query_1.QueryDirection.Request;
        q.Type = query_1.QueryType.Pool;
        q.To = poolName;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        this.sendMessage(q, callback);
    };
    OnPoolClient.prototype.SendAllPoolMessage = function (poolName, method, payload, callback, responseOptions) {
        if (callback === void 0) { callback = null; }
        if (responseOptions === void 0) { responseOptions = query_1.ResponseOptions.SingleResponse; }
        var q = new query_1.Query();
        q.Method = method;
        q.Direction = query_1.QueryDirection.Request;
        q.Type = query_1.QueryType.PoolAll;
        q.To = poolName;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        this.sendMessage(q, callback);
    };
    OnPoolClient.prototype.Disconnect = function () {
        this.socketManager.ForceDisconnect();
    };
    OnPoolClient.prototype.sendMessage = function (query, callback) {
        if (callback === void 0) { callback = null; }
        var responseKey = utils_1.Utils.guid();
        query.RequestKey = responseKey;
        this.messageResponses[responseKey] = function (payload) {
            callback && callback(payload.GetJson());
        };
        if (this.socketManager.Id != null && query.From == null)
            query.From = this.socketManager.Id;
        return this.socketManager.SendMessage(query);
    };
    OnPoolClient.prototype.invokeMessage = function (from, message, respond) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](from, message, respond);
        }
    };
    OnPoolClient.prototype.invokeDisconnect = function () {
        for (var i = 0; i < this.onDisconnect.length; i++) {
            this.onDisconnect[i]();
        }
    };
    OnPoolClient.prototype.invokeReady = function () {
        for (var i = 0; i < this.onReady.length; i++) {
            this.onReady[i]();
        }
    };
    return OnPoolClient;
}());
exports.OnPoolClient = OnPoolClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25Qb29sQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL29uUG9vbENsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHdDQUFvRjtBQUNwRiwrQkFBc0M7QUFFdEMsd0RBQXVEO0FBRXZELHdDQUF1QztBQUl2QztJQUFBO1FBQ1ksVUFBSyxHQUFXLEVBQUUsQ0FBQztRQUNuQixZQUFPLEdBQWEsRUFBRSxDQUFDO1FBTS9CLG1CQUFjLEdBQThCLEVBQUUsQ0FBQztRQUMvQyxxQkFBZ0IsR0FBOEMsRUFBRSxDQUFDO1FBR3pELFlBQU8sR0FBbUIsRUFBRSxDQUFDO1FBQzdCLGlCQUFZLEdBQW1CLEVBQUUsQ0FBQztRQUNsQyxjQUFTLEdBQWdCLEVBQUUsQ0FBQztJQXNOeEMsQ0FBQztJQS9ORyxzQkFBVyxxQ0FBVzthQUF0QjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztRQUNqQyxDQUFDOzs7T0FBQTtJQVNNLHNDQUFlLEdBQXRCLFVBQXVCLEVBQVU7UUFBakMsaUJBU0M7UUFSRyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksNkJBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxVQUFDLElBQUksRUFBRSxLQUFLLElBQUssT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUExQixDQUEwQixDQUFDO1FBQzNFLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUF2QixDQUF1QixDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQUMsRUFBRTtZQUNoQixLQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsR0FBRyxF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