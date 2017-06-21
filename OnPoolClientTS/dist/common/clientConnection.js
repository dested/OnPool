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
        this.client.setKeepAlive(true);
        this.client.connect(1987, this.serverIp, function () {
            // console.log('Connected');
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
            // console.log('Connection closed');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50Q29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tb24vY2xpZW50Q29ubmVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUE4QjtBQUM5Qix5QkFBMkI7QUFDM0IsaUNBQThCO0FBSzlCO0lBYUksMEJBQVksUUFBZ0I7UUFYcEIsaUJBQVksR0FBWSxLQUFLLENBQUM7UUFFL0IsaUJBQVksR0FBMkMsRUFBRSxDQUFDO1FBQzFELGNBQVMsR0FBZ0IsRUFBRSxDQUFDO1FBQzVCLDBCQUFxQixHQUE0QixFQUFFLENBQUM7UUFJM0QsbUJBQWMsR0FBOEIsRUFBRSxDQUFDO1FBQy9DLHFCQUFnQixHQUE4QyxFQUFFLENBQUM7UUFHN0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDN0IsQ0FBQztJQUVNLDBDQUFlLEdBQXRCO1FBQUEsaUJBZ0NDO1FBL0JHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDckMsNEJBQTRCO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFDLEtBQWlCO1lBQ3JDLElBQUksUUFBUSxHQUFXLENBQUMsQ0FBQztZQUV6QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FB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