"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Message_1 = require("./common/Message");
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
        this.socketManager.onReceive = function (from, message) { return _this.messageProcess(message); };
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
            case Message_1.MessageDirection.Request:
                var receiptId_1 = message.RequestKey;
                this.onReceiveMessage(fromClient, message, function (messageResponse) {
                    var q = new Message_1.Message();
                    q.Method = message.Method;
                    q.Direction = Message_1.MessageDirection.Response;
                    q.Type = message.Type;
                    q.AddJson(messageResponse);
                    q.ResponseOptions = message.ResponseOptions;
                    q.To = fromClient.Id;
                    q.RequestKey = receiptId_1;
                    if (message.PoolAllCount > -1) {
                        q.PoolAllCount = message.PoolAllCount;
                    }
                    _this.socketManager.SendMessage(q);
                });
                break;
            case Message_1.MessageDirection.Response:
                if (this.messageResponses[message.RequestKey]) {
                    var callback = this.messageResponses[message.RequestKey];
                    if (message.ResponseOptions === Message_1.ResponseOptions.SingleResponse) {
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
    OnPoolClient.prototype.onReceiveMessage = function (from, message, respond) {
        switch (message.Type) {
            case Message_1.MessageType.Client:
                this.invokeMessage(from, message, respond);
                return;
            case Message_1.MessageType.Pool:
                {
                    var pool = this.pools.filter(function (a) { return a.PoolName === message.To; })[0];
                    pool && pool.ReceiveMessage(from, message, respond);
                    return;
                }
            case Message_1.MessageType.PoolAll:
                {
                    var pool = this.pools.filter(function (a) { return a.PoolName === message.To; })[0];
                    pool && pool.ReceiveMessage(from, message, respond);
                }
                break;
            default:
                throw "Type not found: " + message;
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
        var message = Message_1.Message.BuildServerRequest("GetClientId");
        this.sendMessage(message, callback);
    };
    OnPoolClient.prototype.GetAllPools = function (poolName, callback) {
        var message = Message_1.Message.BuildServerRequest("GetAllPools");
        this.sendMessage(message, callback);
    };
    OnPoolClient.prototype.OnPoolUpdated = function (poolName, callback) {
        var _this = this;
        var message = Message_1.Message.BuildServerRequest("OnPoolUpdated", Message_1.ResponseOptions.OpenResponse);
        message.AddJson(poolName);
        this.sendMessage(message, function (response) {
            callback(response.Clients.map(function (a) { return _this.GetClientById(a.Id); }));
        });
    };
    OnPoolClient.prototype.GetClients = function (poolName, callback) {
        var _this = this;
        var message = Message_1.Message.BuildServerRequest("GetClients");
        message.AddJson(poolName);
        this.sendMessage(message, function (response) {
            callback(response.Clients.map(function (a) { return _this.GetClientById(a.Id); }));
        });
    };
    OnPoolClient.prototype.JoinPool = function (poolName) {
        var pool = new pool_1.Pool(poolName);
        this.pools.push(pool);
        var message = Message_1.Message.BuildServerRequest("JoinPool");
        message.AddJson(poolName);
        this.sendMessage(message);
        return pool;
    };
    OnPoolClient.prototype.LeavePool = function (poolName) {
        var _this = this;
        var message = Message_1.Message.BuildServerRequest("LeavePool");
        message.AddJson(poolName);
        this.sendMessage(message, function (response) {
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
        if (responseOptions === void 0) { responseOptions = Message_1.ResponseOptions.SingleResponse; }
        var q = new Message_1.Message();
        q.Method = method;
        q.Direction = Message_1.MessageDirection.Request;
        q.Type = Message_1.MessageType.Client;
        q.To = clientId;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        this.sendMessage(q, callback);
    };
    OnPoolClient.prototype.SendPoolMessage = function (poolName, method, payload, callback, responseOptions) {
        if (callback === void 0) { callback = null; }
        if (responseOptions === void 0) { responseOptions = Message_1.ResponseOptions.SingleResponse; }
        var q = new Message_1.Message();
        q.Method = method;
        q.Direction = Message_1.MessageDirection.Request;
        q.Type = Message_1.MessageType.Pool;
        q.To = poolName;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        this.sendMessage(q, callback);
    };
    OnPoolClient.prototype.SendAllPoolMessage = function (poolName, method, payload, callback, responseOptions) {
        if (callback === void 0) { callback = null; }
        if (responseOptions === void 0) { responseOptions = Message_1.ResponseOptions.SingleResponse; }
        var q = new Message_1.Message();
        q.Method = method;
        q.Direction = Message_1.MessageDirection.Request;
        q.Type = Message_1.MessageType.PoolAll;
        q.To = poolName;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        this.sendMessage(q, callback);
    };
    OnPoolClient.prototype.Disconnect = function () {
        this.socketManager.ForceDisconnect();
    };
    OnPoolClient.prototype.sendMessage = function (message, callback) {
        if (callback === void 0) { callback = null; }
        var responseKey = utils_1.Utils.guid();
        message.RequestKey = responseKey;
        this.messageResponses[responseKey] = function (payload) {
            callback && callback(payload.GetJson());
        };
        if (this.socketManager.Id != null && message.From == null)
            message.From = this.socketManager.Id;
        return this.socketManager.SendMessage(message);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25Qb29sQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL29uUG9vbENsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRDQUE0RjtBQUM1RiwrQkFBc0M7QUFFdEMsd0RBQXVEO0FBRXZELHdDQUF1QztBQUl2QztJQUFBO1FBQ1ksVUFBSyxHQUFXLEVBQUUsQ0FBQztRQUNuQixZQUFPLEdBQWEsRUFBRSxDQUFDO1FBTS9CLG1CQUFjLEdBQThCLEVBQUUsQ0FBQztRQUMvQyxxQkFBZ0IsR0FBa0QsRUFBRSxDQUFDO1FBRzdELFlBQU8sR0FBbUIsRUFBRSxDQUFDO1FBQzdCLGlCQUFZLEdBQW1CLEVBQUUsQ0FBQztRQUNsQyxjQUFTLEdBQWdCLEVBQUUsQ0FBQztJQXFOeEMsQ0FBQztJQTlORyxzQkFBVyxxQ0FBVzthQUF0QjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztRQUNqQyxDQUFDOzs7T0FBQTtJQVNNLHNDQUFlLEdBQXRCLFVBQXVCLEVBQVU7UUFBakMsaUJBU0M7UUFSRyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksNkJBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxVQUFDLElBQUksRUFBRSxPQUFPLElBQUssT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUE1QixDQUE0QixDQUFDO1FBQy9FLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUF2QixDQUF1QixDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQUMsRUFBRTtZQUNoQixLQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsR0FBRyxF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