"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Message_1 = require("./Message");
var net = require("net");
var SocketManager = (function () {
    function SocketManager(serverIp) {
        this.Id = -1;
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
        var curPayloadLen = -1;
        this.socket.on('data', function (bytes) {
            for (var j = 0; j < bytes.length; j++) {
                var b = bytes[j];
                continueBuffer[bufferIndex++] = b;
                if (curPayloadLen === bufferIndex) {
                    _this.onReceive(_this, Message_1.Message.Parse(continueBuffer.slice(0, bufferIndex)));
                    bufferIndex = 0;
                    curPayloadLen = -1;
                }
                else if (bufferIndex === 4) {
                    curPayloadLen = Message_1.Message.ReadBytesInt(continueBuffer, 0);
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
SocketManager.counterWidth = 1000000000000;
exports.SocketManager = SocketManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0TWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tb24vc29ja2V0TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFDQUFvQztBQUNwQyx5QkFBMkI7QUFJM0I7SUFTSSx1QkFBWSxRQUFnQjtRQVJyQixPQUFFLEdBQVMsQ0FBQyxDQUFDLENBQUM7UUFDYixpQkFBWSxHQUFZLEtBQUssQ0FBQztRQUcvQixpQkFBWSxHQUF3QyxFQUFFLENBQUM7UUFLMUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDN0IsQ0FBQztJQUVNLHVDQUFlLEdBQXRCO1FBQUEsaUJBaUNDO1FBaENHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUNwQixJQUFJLENBQUMsUUFBUSxFQUNiO1lBQ0ksNEJBQTRCO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBRVAsSUFBSSxjQUFjLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNyRCxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDcEIsSUFBSSxhQUFhLEdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUNqQixVQUFDLEtBQWlCO1lBQ2QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFakIsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQyxFQUFFLENBQUMsQ0FBQyxhQUFhLEtBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQztvQkFDOUIsS0FBSSxDQUFDLFNBQVMsQ0FBQyxLQUFJLEVBQUUsaUJBQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxRSxXQUFXLEdBQUcsQ0FBQyxDQUFDO29CQUNoQixhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBRXZCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMzQixhQUFhLEdBQUcsaUJBQU8sQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRVAsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUNsQjtZQUNJLG9DQUFvQztRQUN4QyxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTSxtQ0FBVyxHQUFsQixVQUFtQixPQUFnQjtRQUMvQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDakIsQ0FBQztRQUVELElBQUksQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDVixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFtQixFQUFJLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEIsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBR00sdUNBQWUsR0FBdEI7UUFDSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRU8sa0NBQVUsR0FBbEI7UUFDSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNwQixNQUFNLENBQUM7UUFDWCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDekIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsQ0FBQztJQUNMLENBQUM7SUFFTCxvQkFBQztBQUFELENBQUMsQUFqRkQ7QUFPVywwQkFBWSxHQUFTLGFBQWEsQ0FBQztBQVBqQyxzQ0FBYSJ9