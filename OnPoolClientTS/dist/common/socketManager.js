"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var query_1 = require("./query");
var net = require("net");
var SocketManager = (function () {
    function SocketManager(serverIp) {
        this.disconnected = false;
        this.OnDisconnect = [];
        this.serverIp = serverIp;
    }
    SocketManager.prototype.StartFromClient = function () {
        var _this = this;
        this.socket = new net.Socket();
        this.socket.setKeepAlive(true);
        this.socket.connect(1987, this.serverIp, function () {
            // console.log('Connected');
        });
        var continueBuffer = new Uint8Array(1024 * 1024 * 5);
        var bufferIndex = 0;
        this.socket.on('data', function (bytes) {
            for (var j = 0; j < bytes.length; j++) {
                var b = bytes[j];
                if (b === 0) {
                    _this.onReceive(_this, query_1.Query.Parse(continueBuffer.slice(0, bufferIndex)));
                    bufferIndex = 0;
                }
                else {
                    continueBuffer[bufferIndex++] = b;
                }
            }
        });
        this.socket.on('close', function () {
            // console.log('Connection closed');
        });
    };
    SocketManager.prototype.SendMessage = function (message) {
        if (this.socket.destroyed) {
            this.Disconnect();
            return false;
        }
        try {
            this.socket.write(new Buffer(message.GetBytes()));
        }
        catch (ex) {
            console.log("Send exception: " + ex);
            this.Disconnect();
            return false;
        }
        return true;
    };
    SocketManager.prototype.ForceDisconnect = function () {
        this.socket.destroy();
        this.Disconnect();
    };
    SocketManager.prototype.Disconnect = function () {
        if (this.disconnected) {
            return;
        }
        this.disconnected = true;
        for (var i = 0; i < this.OnDisconnect.length; i++) {
            this.OnDisconnect[i](this);
        }
    };
    return SocketManager;
}());
exports.SocketManager = SocketManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0TWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tb24vc29ja2V0TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFnQztBQUNoQyx5QkFBMkI7QUFJM0I7SUFRSSx1QkFBWSxRQUFnQjtRQU5wQixpQkFBWSxHQUFZLEtBQUssQ0FBQztRQUcvQixpQkFBWSxHQUF3QyxFQUFFLENBQUM7UUFJMUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDN0IsQ0FBQztJQUVNLHVDQUFlLEdBQXRCO1FBQUEsaUJBNEJDO1FBM0JHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUNwQixJQUFJLENBQUMsUUFBUSxFQUNiO1lBQ0ksNEJBQTRCO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBRVAsSUFBSSxjQUFjLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNyRCxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUNqQixVQUFDLEtBQWlCO1lBQ2QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakIsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ1YsS0FBSSxDQUFDLFNBQVMsQ0FBQyxLQUFJLEVBQUUsYUFBSyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3hFLFdBQVcsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ0osY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRVAsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUNsQjtZQUNJLG9DQUFvQztRQUN4QyxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTSxtQ0FBVyxHQUFsQixVQUFtQixPQUFjO1FBQzdCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEIsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQW1CLEVBQUksQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNsQixNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFHTSx1Q0FBZSxHQUF0QjtRQUNJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFTyxrQ0FBVSxHQUFsQjtRQUNJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sQ0FBQztRQUNYLENBQUM7UUFDRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUN6QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDaEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDO0lBQ0wsQ0FBQztJQUNMLG9CQUFDO0FBQUQsQ0FBQyxBQTFFRCxJQTBFQztBQTFFWSxzQ0FBYSJ9