"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var query_1 = require("./query");
var net = require("net");
var utils_1 = require("./utils");
var ClientConnection = (function () {
    function ClientConnection(serverIp) {
        this.disconnected = false;
        this.OnDisconnect = [];
        this.OnMessage = [];
        this.OnMessageWithResponse = [];
        this.poolAllCounter = {};
        this.messageResponses = {};
        this.serverIp = serverIp;
    }
    ClientConnection.prototype.StartFromClient = function () {
        var _this = this;
        this.client = new net.Socket();
        this.client.connect(1987, this.serverIp, function () {
            console.log('Connected');
        });
        var continueBuffer = '';
        this.client.on('data', function (bytes) {
            var lastZero = 0;
            for (var j = 0; j < bytes.length; j++) {
                var b = bytes[j];
                if (b == 0) {
                    var piece = new Buffer(bytes.slice(lastZero, j - 1));
                    var str = piece.toString("ascii");
                    lastZero = j + 1;
                    _this.ReceiveResponse(continueBuffer + str);
                    continueBuffer = "";
                }
            }
            if (lastZero != bytes.length) {
                var piece = new Buffer(bytes.slice(lastZero, bytes.length));
                var str = piece.toString("ascii");
                continueBuffer += str;
            }
        });
        this.client.on('close', function () {
            console.log('Connection closed');
        });
    };
    ClientConnection.prototype.SendMessageWithResponse = function (message, callback) {
        var responseKey = utils_1.Utils.guid();
        message.Add("~ResponseKey~", responseKey);
        this.messageResponses[responseKey] = callback;
        return this.SendMessage(message);
    };
    ClientConnection.prototype.SendMessage = function (message) {
        if (this.client.destroyed) {
            this.Disconnect();
            return false;
        }
        try {
            this.client.write(message.ToString() + "\0");
        }
        catch (ex) {
            console.log("Send exception: " + ex);
            this.Disconnect();
            return false;
        }
        return true;
    };
    ClientConnection.prototype.ReceiveResponse = function (payload) {
        var _this = this;
        var query = query_1.Query.Parse(payload);
        if (query.Contains("~Response~")) {
            query.Remove("~Response~");
            if (this.messageResponses[query.get("~ResponseKey~")]) {
                var callback = this.messageResponses[query.get("~ResponseKey~")];
                if (query.Contains("~PoolAllCount~")) {
                    if (!this.poolAllCounter[query.get("~ResponseKey~")]) {
                        this.poolAllCounter[query.get("~ResponseKey~")] = 1;
                    }
                    else {
                        this.poolAllCounter[query.get("~ResponseKey~")] = this.poolAllCounter[query.get("~ResponseKey~")] + 1;
                    }
                    if (this.poolAllCounter[query.get("~ResponseKey~")] === parseInt(query.get("~PoolAllCount~"))) {
                        delete this.messageResponses[query.get("~ResponseKey~")];
                        delete this.poolAllCounter[query.get("~ResponseKey~")];
                    }
                }
                else {
                    delete this.messageResponses[query.get("~ResponseKey~")];
                }
                query.Remove("~ResponseKey~");
                callback(query);
            }
            else {
                throw "Cannot find response callback";
            }
        }
        else if (query.Contains("~ResponseKey~")) {
            var receiptId = query.get("~ResponseKey~");
            query.Remove("~ResponseKey~");
            for (var i = 0; i < this.OnMessageWithResponse.length; i++) {
                this.OnMessageWithResponse[i](this, query, function (queryResponse) {
                    queryResponse.Add("~Response~");
                    queryResponse.Add("~ResponseKey~", receiptId);
                    _this.SendMessage(queryResponse);
                });
            }
        }
        else {
            for (var i = 0; i < this.OnMessage.length; i++) {
                this.OnMessage[i](this, query);
            }
        }
    };
    ClientConnection.prototype.ForceDisconnect = function () {
        this.client.destroy();
        this.Disconnect();
    };
    ClientConnection.prototype.Disconnect = function () {
        if (this.disconnected) {
            return;
        }
        this.disconnected = true;
        for (var i = 0; i < this.OnDisconnect.length; i++) {
            this.OnDisconnect[i](this);
        }
    };
    return ClientConnection;
}());
exports.ClientConnection = ClientConnection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50Q29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tb24vY2xpZW50Q29ubmVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUE4QjtBQUM5Qix5QkFBMkI7QUFDM0IsaUNBQThCO0FBRTlCO0lBYUksMEJBQVksUUFBZ0I7UUFYcEIsaUJBQVksR0FBWSxLQUFLLENBQUM7UUFFL0IsaUJBQVksR0FBMkMsRUFBRSxDQUFDO1FBQzFELGNBQVMsR0FBeUQsRUFBRSxDQUFDO1FBQ3JFLDBCQUFxQixHQUEyRixFQUFFLENBQUM7UUFJMUgsbUJBQWMsR0FBOEIsRUFBRSxDQUFDO1FBQy9DLHFCQUFnQixHQUE4QyxFQUFFLENBQUM7UUFHN0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDN0IsQ0FBQztJQUVNLDBDQUFlLEdBQXRCO1FBQUEsaUJBK0JDO1FBOUJHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBQyxLQUFpQjtZQUNyQyxJQUFJLFFBQVEsR0FBVyxDQUFDLENBQUM7WUFFekIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakIsRUFBRSxDQUFD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