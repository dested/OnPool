"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var query_1 = require("./query");
var net = require("net");
var utils_1 = require("./utils");
var SocketLayer = (function () {
    function SocketLayer(serverIp, getSwimmer) {
        this.disconnected = false;
        this.OnDisconnect = [];
        this.OnMessage = [];
        this.OnMessageWithResponse = [];
        this.poolAllCounter = {};
        this.messageResponses = {};
        this.serverIp = serverIp;
        this._getSwimmer = getSwimmer;
    }
    SocketLayer.prototype.StartFromClient = function () {
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
    SocketLayer.prototype.SendMessageWithResponse = function (message, callback) {
        var responseKey = utils_1.Utils.guid();
        message.Add("~ResponseKey~", responseKey);
        this.messageResponses[responseKey] = callback;
        return this.SendMessage(message);
    };
    SocketLayer.prototype.SendMessage = function (message) {
        if (this.client.destroyed) {
            this.Disconnect();
            return false;
        }
        if (this.Id != null)
            message.Add("~FromSwimmer~", this.Id);
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
    SocketLayer.prototype.ReceiveResponse = function (payload) {
        var _this = this;
        var query = query_1.Query.Parse(payload);
        var fromSwimmer = this._getSwimmer(query.get("~FromSwimmer~"));
        if (query.Contains("~Response~")) {
            query.Remove("~Response~");
            if (this.messageResponses[query.get("~ResponseKey~")]) {
                var callback = this.messageResponses[query.get("~ResponseKey~")];
                if (query.Contains("~PoolAllCount~")) {
                    if (!this.poolAllCounter[query.get("~ResponseKey~")]) {
                        this.poolAllCounter[query.get("~ResponseKey~")] = 1;
                    }
                    else {
                        this.poolAllCounter[query.get("~ResponseKey~")] =
                            this.poolAllCounter[query.get("~ResponseKey~")] + 1;
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
            this.invokeMessageWithResponse(fromSwimmer, query, function (queryResponse) {
                queryResponse.Add("~Response~");
                queryResponse.Add("~ResponseKey~", receiptId);
                _this.SendMessage(queryResponse);
            });
        }
        else {
            this.invokeMessage(fromSwimmer, query);
        }
    };
    SocketLayer.prototype.ForceDisconnect = function () {
        this.client.destroy();
        this.Disconnect();
    };
    SocketLayer.prototype.Disconnect = function () {
        if (this.disconnected) {
            return;
        }
        this.disconnected = true;
        for (var i = 0; i < this.OnDisconnect.length; i++) {
            this.OnDisconnect[i](this);
        }
    };
    SocketLayer.prototype.invokeMessageWithResponse = function (from, query, response) {
        for (var i = 0; i < this.OnMessageWithResponse.length; i++) {
            this.OnMessageWithResponse[i](from, query, response);
        }
    };
    SocketLayer.prototype.invokeMessage = function (from, query) {
        for (var i = 0; i < this.OnMessageWithResponse.length; i++) {
            this.OnMessage[i](from, query);
        }
    };
    return SocketLayer;
}());
exports.SocketLayer = SocketLayer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0TGF5ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbW9uL3NvY2tldExheWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQThCO0FBQzlCLHlCQUEyQjtBQUMzQixpQ0FBOEI7QUFNOUI7SUFlSSxxQkFBWSxRQUFnQixFQUFFLFVBQTBDO1FBYmhFLGlCQUFZLEdBQVksS0FBSyxDQUFDO1FBRS9CLGlCQUFZLEdBQXNDLEVBQUUsQ0FBQztRQUNyRCxjQUFTLEdBQWdCLEVBQUUsQ0FBQztRQUM1QiwwQkFBcUIsR0FBNEIsRUFBRSxDQUFDO1FBTTNELG1CQUFjLEdBQThCLEVBQUUsQ0FBQztRQUMvQyxxQkFBZ0IsR0FBOEMsRUFBRSxDQUFDO1FBRzdELElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0lBQ2xDLENBQUM7SUFFTSxxQ0FBZSxHQUF0QjtRQUFBLGlCQW9DQztRQW5DRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFDcEIsSUFBSSxDQUFDLFFBQVEsRUFDYjtZQUNJLDRCQUE0QjtRQUNoQyxDQUFDLENBQUMsQ0FBQztRQUVQLElBQUksY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQ2pCLFVBQUMsS0FBaUI7WUFDZCxJQUFJLFFBQVEsR0FBVyxDQUFDLENBQUM7WUFFekIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JB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