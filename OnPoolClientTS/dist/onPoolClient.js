"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Message_1 = require("./common/Message");
var pool_1 = require("./pool");
var socketManager_1 = require("./common/socketManager");
var OnPoolClient = (function () {
    function OnPoolClient() {
        this.pools = [];
        this.clients = [];
        this.poolAllCounter = {};
        this.messageResponses = {};
        this.onReady = [];
        this.onDisconnect = [];
        this.onMessage = [];
        this.messageCounter = 0;
    }
    Object.defineProperty(OnPoolClient.prototype, "MyClientId", {
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
                    q.From = message.From;
                    q.Type = message.Type;
                    q.ResponseOptions = message.ResponseOptions;
                    q.ToClient = fromClient.Id;
                    q.RequestKey = receiptId_1;
                    q.PoolAllCount = message.PoolAllCount;
                    q.AddJson(messageResponse);
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
        switch (message.Method) {
            case "Ping":
                respond({ ClientId: this.MyClientId });
                return;
        }
        switch (message.Type) {
            case Message_1.MessageType.Client:
                {
                    this.invokeMessage(from, message, respond);
                    return;
                }
            case Message_1.MessageType.ClientPool:
                {
                    var pool = this.pools.filter(function (a) { return a.PoolName === message.ToPool; })[0];
                    pool && pool.ReceiveMessage(from, message, respond);
                    return;
                }
            case Message_1.MessageType.Pool:
                {
                    var pool = this.pools.filter(function (a) { return a.PoolName === message.ToPool; })[0];
                    pool && pool.ReceiveMessage(from, message, respond);
                    return;
                }
            case Message_1.MessageType.PoolAll:
                {
                    var pool = this.pools.filter(function (a) { return a.PoolName === message.ToPool; })[0];
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
        var message = new Message_1.Message();
        message.Method = method;
        message.Direction = Message_1.MessageDirection.Request;
        message.Type = Message_1.MessageType.Client;
        message.ToClient = clientId;
        message.ResponseOptions = responseOptions;
        message.AddJson(payload);
        this.sendMessage(message, callback);
    };
    OnPoolClient.prototype.SendClientPoolMessage = function (clientId, poolName, method, payload, callback, responseOptions) {
        if (payload === void 0) { payload = null; }
        if (callback === void 0) { callback = null; }
        if (responseOptions === void 0) { responseOptions = Message_1.ResponseOptions.SingleResponse; }
        var message = new Message_1.Message();
        message.Method = method;
        message.Direction = Message_1.MessageDirection.Request;
        message.Type = Message_1.MessageType.ClientPool;
        message.ToClient = clientId;
        message.ToPool = poolName;
        message.ResponseOptions = responseOptions;
        message.AddJson(payload);
        this.sendMessage(message, callback);
    };
    OnPoolClient.prototype.SendPoolMessage = function (poolName, method, payload, callback, responseOptions) {
        if (callback === void 0) { callback = null; }
        if (responseOptions === void 0) { responseOptions = Message_1.ResponseOptions.SingleResponse; }
        var q = new Message_1.Message();
        q.Method = method;
        q.Direction = Message_1.MessageDirection.Request;
        q.Type = Message_1.MessageType.Pool;
        q.ToPool = poolName;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        this.sendMessage(q, callback);
    };
    OnPoolClient.prototype.SendPoolFastestMessage = function (poolName, method, payload, callback) {
        var _this = this;
        if (payload === void 0) { payload = null; }
        if (callback === void 0) { callback = null; }
        var message = new Message_1.Message();
        message.Method = "Ping";
        message.Direction = Message_1.MessageDirection.Request;
        message.Type = Message_1.MessageType.PoolAll;
        message.ToPool = poolName;
        message.ResponseOptions = Message_1.ResponseOptions.SingleResponse;
        var first = false;
        this.sendMessage(message, function (r) {
            if (first)
                return;
            first = true;
            _this.SendClientPoolMessage(r.ClientId, poolName, method, payload, callback);
        });
    };
    OnPoolClient.prototype.SendAllPoolMessage = function (poolName, method, payload, callback, responseOptions) {
        if (callback === void 0) { callback = null; }
        if (responseOptions === void 0) { responseOptions = Message_1.ResponseOptions.SingleResponse; }
        var message = new Message_1.Message();
        message.Method = method;
        message.Direction = Message_1.MessageDirection.Request;
        message.Type = Message_1.MessageType.PoolAll;
        message.ToPool = poolName;
        message.ResponseOptions = responseOptions;
        message.AddJson(payload);
        this.sendMessage(message, callback);
    };
    OnPoolClient.prototype.Disconnect = function () {
        this.socketManager.ForceDisconnect();
    };
    OnPoolClient.prototype.sendMessage = function (message, callback) {
        if (callback === void 0) { callback = null; }
        var messageRequestKey;
        if (this.socketManager.Id == -1) {
            messageRequestKey = Math.floor(Math.random() * 0xFFFFFFFF);
        }
        else {
            messageRequestKey = this.socketManager.Id + (++this.messageCounter % socketManager_1.SocketManager.counterWidth);
        }
        message.RequestKey = messageRequestKey;
        this.messageResponses[messageRequestKey] = function (payload) {
            callback && callback(payload.GetJson());
        };
        if (this.socketManager.Id !== -1 && message.From === -1)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25Qb29sQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL29uUG9vbENsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRDQUEyRjtBQUMzRiwrQkFBc0M7QUFFdEMsd0RBQXVEO0FBTXZEO0lBQUE7UUFDWSxVQUFLLEdBQVcsRUFBRSxDQUFDO1FBQ25CLFlBQU8sR0FBYSxFQUFFLENBQUM7UUFPL0IsbUJBQWMsR0FBOEIsRUFBRSxDQUFDO1FBQy9DLHFCQUFnQixHQUFrRCxFQUFFLENBQUM7UUFHN0QsWUFBTyxHQUFtQixFQUFFLENBQUM7UUFDN0IsaUJBQVksR0FBbUIsRUFBRSxDQUFDO1FBQ2xDLGNBQVMsR0FBZ0IsRUFBRSxDQUFDO1FBMFE1QixtQkFBYyxHQUFXLENBQUMsQ0FBQztJQXVDdkMsQ0FBQztJQTNURyxzQkFBVyxvQ0FBVTthQUFyQjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztRQUNqQyxDQUFDOzs7T0FBQTtJQVVNLHNDQUFlLEdBQXRCLFVBQXVCLEVBQVU7UUFBakMsaUJBU0M7UUFSRyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksNkJBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxVQUFDLElBQUksRUFBRSxPQUFPLElBQUssT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUE1QixDQUE0QixDQUFDO1FBQy9FLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUF2QixDQUF1QixDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQUMsRUFBRTtZQUNoQixLQUFJLENBQUMsYUFBYSxD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