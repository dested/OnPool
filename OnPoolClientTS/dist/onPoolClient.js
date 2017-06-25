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
        this.socketManager = new socketManager_1.SocketManager("127.0.0.1");
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
                    if (message.Contains("~PoolAllCount~")) {
                        q.Add("~PoolAllCount~", message.Get("~PoolAllCount~"));
                    }
                    _this.socketManager.SendMessage(q);
                });
                break;
            case query_1.QueryDirection.Response:
                if (this.messageResponses[message.RequestKey]) {
                    var callback = this.messageResponses[message.RequestKey];
                    if (message.ResponseOptions === query_1.ResponseOptions.SingleResponse) {
                        if (message.Contains("~PoolAllCount~")) {
                            if (!this.poolAllCounter[message.RequestKey])
                                this.poolAllCounter[message.RequestKey] = 1;
                            else
                                this.poolAllCounter[message.RequestKey] = this.poolAllCounter[message.RequestKey] + 1;
                            if (this.poolAllCounter[message.RequestKey] === parseInt(message.Get("~PoolAllCount~"))) {
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
        query.Add("PoolName", poolName);
        this.sendMessage(query, function (response) {
            callback(response.Clients.map(function (a) { return _this.GetClientById(a.Id); }));
        });
    };
    OnPoolClient.prototype.GetClients = function (poolName, callback) {
        var _this = this;
        var query = query_1.Query.BuildServerRequest("GetClients");
        query.Add("PoolName", poolName);
        this.sendMessage(query, function (response) {
            callback(response.Clients.map(function (a) { return _this.GetClientById(a.Id); }));
        });
    };
    OnPoolClient.prototype.JoinPool = function (poolName) {
        var pool = new pool_1.Pool(poolName);
        this.pools.push(pool);
        var query = query_1.Query.BuildServerRequest("JoinPool");
        query.Add("PoolName", poolName);
        this.sendMessage(query);
        return pool;
    };
    OnPoolClient.prototype.LeavePool = function (poolName) {
        var _this = this;
        var query = query_1.Query.BuildServerRequest("LeavePool");
        query.Add("PoolName", poolName);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25Qb29sQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL29uUG9vbENsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHdDQUErRjtBQUMvRiwrQkFBc0M7QUFFdEMsd0RBQXVEO0FBRXZELHdDQUF1QztBQUl2QztJQUFBO1FBQ1ksVUFBSyxHQUFXLEVBQUUsQ0FBQztRQUNuQixZQUFPLEdBQWEsRUFBRSxDQUFDO1FBTS9CLG1CQUFjLEdBQThCLEVBQUUsQ0FBQztRQUMvQyxxQkFBZ0IsR0FBOEMsRUFBRSxDQUFDO1FBR3pELFlBQU8sR0FBbUIsRUFBRSxDQUFDO1FBQzdCLGlCQUFZLEdBQW1CLEVBQUUsQ0FBQztRQUNsQyxjQUFTLEdBQWdCLEVBQUUsQ0FBQztJQXNOeEMsQ0FBQztJQS9ORyxzQkFBVyxxQ0FBVzthQUF0QjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztRQUNqQyxDQUFDOzs7T0FBQTtJQVNNLHNDQUFlLEdBQXRCLFVBQXVCLEVBQVU7UUFBakMsaUJBU0M7UUFSRyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksNkJBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxVQUFDLElBQUksRUFBRSxLQUFLLElBQUssT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUExQixDQUEwQixDQUFDO1FBQzNFLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUF2QixDQUF1QixDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQUMsRUFBRTtZQUNoQixLQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsR0FBRyxF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