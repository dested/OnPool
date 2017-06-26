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
                    q.Type = message.Type;
                    q.AddJson(messageResponse);
                    q.ResponseOptions = message.ResponseOptions;
                    q.ToClient = fromClient.Id;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25Qb29sQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL29uUG9vbENsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRDQUEyRjtBQUMzRiwrQkFBc0M7QUFFdEMsd0RBQXVEO0FBTXZEO0lBQUE7UUFDWSxVQUFLLEdBQVcsRUFBRSxDQUFDO1FBQ25CLFlBQU8sR0FBYSxFQUFFLENBQUM7UUFPL0IsbUJBQWMsR0FBOEIsRUFBRSxDQUFDO1FBQy9DLHFCQUFnQixHQUFrRCxFQUFFLENBQUM7UUFHN0QsWUFBTyxHQUFtQixFQUFFLENBQUM7UUFDN0IsaUJBQVksR0FBbUIsRUFBRSxDQUFDO1FBQ2xDLGNBQVMsR0FBZ0IsRUFBRSxDQUFDO1FBMFE1QixtQkFBYyxHQUFXLENBQUMsQ0FBQztJQXVDdkMsQ0FBQztJQTNURyxzQkFBVyxvQ0FBVTthQUFyQjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztRQUNqQyxDQUFDOzs7T0FBQTtJQVVNLHNDQUFlLEdBQXRCLFVBQXVCLEVBQVU7UUFBakMsaUJBU0M7UUFSRyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksNkJBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxVQUFDLElBQUksRUFBRSxPQUFPLElBQUssT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUE1QixDQUE0QixDQUFDO1FBQy9FLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUF2QixDQUF1QixDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQUMsRUFBRTtZQUNoQixLQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDM0IsS0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLHFDQUFjLEdBQXRCLFVBQXVCLE9BQWdCO1FBQXZDLGlCQWlEQztRQWhERyxJQUFJLFVBQWtCLENBQUM7UUFDdkIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUM7WUFDckIsVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xELElBQUk7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVELE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzVCLEtBQUssMEJBQWdCLENBQUMsT0FBTztnQkFDekIsSUFBTSxXQUFTLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFDNUIsT0FBTyxFQUNQLFVBQUEsZUFBZTtvQkFDWCxJQUFNLENBQUMsR0FBRyxJQUFJLGlCQUFPLEVBQUUsQ0FBQztvQkFDeEIsQ0FBQyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO29CQUMxQixDQUFDLENBQUMsU0FBUyxHQUFHLDBCQUFnQixDQUFDLFFBQVEsQ0FBQztvQkFDeEMsQ0FBQyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO29CQUN0QixDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUMzQixDQUFDLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUM7b0JBQzVDLENBQUMsQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQyxDQUFDLFVBQVUsR0FBRyxXQUFTLENBQUM7b0JBQ3pCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM1QixDQUFDLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUM7b0JBQzFDLENBQUM7b0JBQ0QsS0FBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLENBQUMsQ0FBQyxDQUFDO2dCQUNQLEtBQUssQ0FBQztZQUNWLEtBQUssMEJBQWdCLENBQUMsUUFBUTtnQkFDMUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVDLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQzNELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEtBQUsseUJBQWUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO3dCQUM3RCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDNUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQ0FDekMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUNoRCxJQUFJO2dDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDM0YsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0NBQ25FLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQ0FDakQsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs0QkFDbkQsQ0FBQzt3QkFDTCxDQUFDO3dCQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNKLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDckQsQ0FBQztvQkFDTCxDQUFDO29CQUNELFFBQVEsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ0osTUFBTSwrQkFBK0IsQ0FBQztnQkFDMUMsQ0FBQztnQkFDRCxLQUFLLENBQUM7WUFDVjtnQkFDSSxNQUFNLHFCQUFxQixDQUFDO1FBQ2hDLENBQUM7SUFDTCxDQUFDO0lBR08sdUNBQWdCLEdBQXhCLFVBQXlCLElBQVksRUFBRSxPQUFnQixFQUFFLE9BQXVCO1FBRTVFLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLEtBQUssTUFBTTtnQkFDUCxPQUFPLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZDLE1BQU0sQ0FBQztRQUNYLENBQUM7UUFFRCxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2QixLQUFLLHFCQUFXLENBQUMsTUFBTTtnQkFDdkIsQ0FBQztvQkFDRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQzNDLE1BQU0sQ0FBQztnQkFDWCxDQUFDO1lBQ0QsS0FBSyxxQkFBVyxDQUFDLFVBQVU7Z0JBQzNCLENBQUM7b0JBQ0csSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQyxNQUFNLEVBQTdCLENBQTZCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFcEUsSUFBSSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDcEQsTUFBTSxDQUFDO2dCQUNYLENBQUM7WUFDRCxLQUFLLHFCQUFXLENBQUMsSUFBSTtnQkFDckIsQ0FBQztvQkFDRyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLE1BQU0sRUFBN0IsQ0FBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUVwRSxJQUFJLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUNwRCxNQUFNLENBQUM7Z0JBQ1gsQ0FBQztZQUNELEtBQUsscUJBQVcsQ0FBQyxPQUFPO2dCQUNwQixDQUFDO29CQUNHLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLFFBQVEsS0FBSyxPQUFPLENBQUMsTUFBTSxFQUE3QixDQUE2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BFLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3hELENBQUM7Z0JBQ0QsS0FBSyxDQUFDO1lBQ1Y7Z0JBQ0ksTUFBTSxrQkFBa0IsR0FBRyxPQUFPLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7SUFFTyxvQ0FBYSxHQUFyQixVQUFzQixFQUFVO1FBQzVCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQVYsQ0FBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckQsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ1YsTUFBTSxHQUFHLElBQUksYUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFTSw4QkFBTyxHQUFkLFVBQWUsUUFBb0I7UUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVNLG1DQUFZLEdBQW5CLFVBQW9CLFFBQW9CO1FBQ3BDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFTSxnQ0FBUyxHQUFoQixVQUFpQixRQUFtQjtRQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRU0sa0NBQVcsR0FBbEIsVUFBbUIsUUFBNkI7UUFDNUMsSUFBTSxPQUFPLEdBQUcsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRU0sa0NBQVcsR0FBbEIsVUFBbUIsUUFBZ0IsRUFBRSxRQUEwQztRQUMzRSxJQUFNLE9BQU8sR0FBRyxpQkFBTyxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTSxvQ0FBYSxHQUFwQixVQUFxQixRQUFnQixFQUFFLFFBQStCO1FBQXRFLGlCQU9DO1FBTkcsSUFBTSxPQUFPLEdBQUcsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUseUJBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxRixPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFCLElBQUksQ0FBQyxXQUFXLENBQTBCLE9BQU8sRUFDN0MsVUFBQSxRQUFRO1lBQ0osUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsS0FBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQXhCLENBQXdCLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGlDQUFVLEdBQWpCLFVBQWtCLFFBQWdCLEVBQUUsUUFBK0I7UUFBbkUsaUJBT0M7UUFORyxJQUFNLE9BQU8sR0FBRyxpQkFBTyxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3pELE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLFdBQVcsQ0FBMEIsT0FBTyxFQUM3QyxVQUFBLFFBQVE7WUFDSixRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBeEIsQ0FBd0IsQ0FBQyxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sK0JBQVEsR0FBZixVQUFnQixRQUFnQjtRQUM1QixJQUFNLElBQUksR0FBRyxJQUFJLFdBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QixJQUFNLE9BQU8sR0FBRyxpQkFBTyxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLFdBQVcsQ0FBTyxPQUFPLENBQUMsQ0FBQztRQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxnQ0FBUyxHQUFoQixVQUFpQixRQUFnQjtRQUFqQyxpQkFZQztRQVhHLElBQU0sT0FBTyxHQUFHLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDeEQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsV0FBVyxDQUFPLE9BQU8sRUFDMUIsVUFBQSxRQUFRO1lBQ0osR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUMsSUFBTSxJQUFJLEdBQUcsS0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUM3QixLQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sd0NBQWlCLEdBQXhCLFVBQTRCLFFBQWdCLEVBQ3hDLE1BQWMsRUFDZCxPQUFZLEVBQ1osUUFBK0IsRUFDL0IsZUFBaUU7UUFEakUseUJBQUEsRUFBQSxlQUErQjtRQUMvQixnQ0FBQSxFQUFBLGtCQUFtQyx5QkFBZSxDQUFDLGNBQWM7UUFDakUsSUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTyxFQUFFLENBQUM7UUFDOUIsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDeEIsT0FBTyxDQUFDLFNBQVMsR0FBRywwQkFBZ0IsQ0FBQyxPQUFPLENBQUM7UUFDN0MsT0FBTyxDQUFDLElBQUksR0FBRyxxQkFBVyxDQUFDLE1BQU0sQ0FBQztRQUNsQyxPQUFPLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUM1QixPQUFPLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUMxQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTSw0Q0FBcUIsR0FBNUIsVUFBZ0MsUUFBZ0IsRUFDNUMsUUFBZ0IsRUFDaEIsTUFBYyxFQUNkLE9BQW1CLEVBQ25CLFFBQStCLEVBQy9CLGVBQWlFO1FBRmpFLHdCQUFBLEVBQUEsY0FBbUI7UUFDbkIseUJBQUEsRUFBQSxlQUErQjtRQUMvQixnQ0FBQSxFQUFBLGtCQUFtQyx5QkFBZSxDQUFDLGNBQWM7UUFDakUsSUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTyxFQUFFLENBQUM7UUFDOUIsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDeEIsT0FBTyxDQUFDLFNBQVMsR0FBRywwQkFBZ0IsQ0FBQyxPQUFPLENBQUM7UUFDN0MsT0FBTyxDQUFDLElBQUksR0FBRyxxQkFBVyxDQUFDLFVBQVUsQ0FBQztRQUN0QyxPQUFPLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUM1QixPQUFPLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQztRQUMxQixPQUFPLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUMxQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTSxzQ0FBZSxHQUF0QixVQUEwQixRQUFnQixFQUN0QyxNQUFjLEVBQ2QsT0FBWSxFQUNaLFFBQStCLEVBQy9CLGVBQWlFO1FBRGpFLHlCQUFBLEVBQUEsZUFBK0I7UUFDL0IsZ0NBQUEsRUFBQSxrQkFBbUMseUJBQWUsQ0FBQyxjQUFjO1FBRWpFLElBQU0sQ0FBQyxHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxTQUFTLEdBQUcsMEJBQWdCLENBQUMsT0FBTyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxJQUFJLEdBQUcscUJBQVcsQ0FBQyxJQUFJLENBQUM7UUFDMUIsQ0FBQyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7UUFDcEIsQ0FBQyxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7UUFDcEMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQixJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRU0sNkNBQXNCLEdBQTdCLFVBQWlDLFFBQWdCLEVBQzdDLE1BQWMsRUFDZCxPQUFtQixFQUNuQixRQUErQjtRQUhuQyxpQkFvQkM7UUFsQkcsd0JBQUEsRUFBQSxjQUFtQjtRQUNuQix5QkFBQSxFQUFBLGVBQStCO1FBRS9CLElBQU0sT0FBTyxHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFDO1FBQzlCLE9BQU8sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3hCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsMEJBQWdCLENBQUMsT0FBTyxDQUFDO1FBQzdDLE9BQU8sQ0FBQyxJQUFJLEdBQUcscUJBQVcsQ0FBQyxPQUFPLENBQUM7UUFDbkMsT0FBTyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7UUFDMUIsT0FBTyxDQUFDLGVBQWUsR0FBRyx5QkFBZSxDQUFDLGNBQWMsQ0FBQztRQUV6RCxJQUFJLEtBQUssR0FBWSxLQUFLLENBQUM7UUFDM0IsSUFBSSxDQUFDLFdBQVcsQ0FBcUIsT0FBTyxFQUN4QyxVQUFDLENBQUM7WUFDRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ04sTUFBTSxDQUFDO1lBQ1gsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNiLEtBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2hGLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLHlDQUFrQixHQUF6QixVQUE2QixRQUFnQixFQUN6QyxNQUFjLEVBQ2QsT0FBWSxFQUNaLFFBQStCLEVBQy9CLGVBQWlFO1FBRGpFLHlCQUFBLEVBQUEsZUFBK0I7UUFDL0IsZ0NBQUEsRUFBQSxrQkFBbUMseUJBQWUsQ0FBQyxjQUFjO1FBQ2pFLElBQU0sT0FBTyxHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFDO1FBQzlCLE9BQU8sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3hCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsMEJBQWdCLENBQUMsT0FBTyxDQUFDO1FBQzdDLE9BQU8sQ0FBQyxJQUFJLEdBQUcscUJBQVcsQ0FBQyxPQUFPLENBQUM7UUFDbkMsT0FBTyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7UUFDMUIsT0FBTyxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7UUFDMUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBR00saUNBQVUsR0FBakI7UUFDSSxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFJTSxrQ0FBVyxHQUFsQixVQUFzQixPQUFnQixFQUFFLFFBQStCO1FBQS9CLHlCQUFBLEVBQUEsZUFBK0I7UUFFbkUsSUFBSSxpQkFBeUIsQ0FBQztRQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLEdBQUcsNkJBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNyRyxDQUFDO1FBR0QsT0FBTyxDQUFDLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQztRQUN2QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsR0FBRyxVQUFDLE9BQU87WUFDL0MsUUFBUSxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFLLENBQUMsQ0FBQztRQUMvQyxDQUFDLENBQUM7UUFDRixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3BELE9BQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7UUFDekMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFTyxvQ0FBYSxHQUFyQixVQUFzQixJQUFZLEVBQUUsT0FBZ0IsRUFBRSxPQUF1QjtRQUN6RSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzlDLENBQUM7SUFDTCxDQUFDO0lBRU8sdUNBQWdCLEdBQXhCO1FBQ0ksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUMzQixDQUFDO0lBQ0wsQ0FBQztJQUVPLGtDQUFXLEdBQW5CO1FBQ0ksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzNDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUN0QixDQUFDO0lBQ0wsQ0FBQztJQUVMLG1CQUFDO0FBQUQsQ0FBQyxBQWhVRCxJQWdVQztBQWhVWSxvQ0FBWSJ9