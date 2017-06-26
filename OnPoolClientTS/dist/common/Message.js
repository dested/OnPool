"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Int64LE = require("int64-buffer").Int64LE;
var Message = (function () {
    function Message() {
        this.ToClient = -1;
        this.From = -1;
        this.PoolAllCount = -1;
    }
    Message.prototype.AddJson = function (obj) {
        this.Json = JSON.stringify(obj);
        return this;
    };
    Message.prototype.GetBytes = function () {
        var lengthOfPayload = 4, enums = 4, from = 8, toClient = 8, toPoolLen = 4, methodLen = 4, jsonLen = 4, requestKey = 8, poolAllCount = 4;
        var byteLen = 0;
        byteLen += lengthOfPayload;
        byteLen += enums;
        byteLen += from;
        switch (this.Type) {
            case MessageType.Client:
                byteLen += toClient;
                break;
            case MessageType.Pool:
            case MessageType.PoolAll:
                byteLen += toPoolLen;
                if (this.ToPool)
                    byteLen += this.ToPool.length;
                break;
        }
        byteLen += methodLen;
        byteLen += this.Method.length;
        byteLen += jsonLen;
        if (this.Json) {
            byteLen += this.Json.length;
        }
        byteLen += requestKey;
        byteLen += poolAllCount;
        var bytes = new Uint8Array(byteLen);
        var cur = 0;
        this.WriteBytesInt(byteLen, bytes, cur);
        cur += 4;
        bytes[cur++] = this.Direction;
        bytes[cur++] = this.Type;
        bytes[cur++] = this.ResponseOptions;
        this.WriteBytesLong(this.From, bytes, cur);
        cur += 8;
        switch (this.Type) {
            case MessageType.Client:
                this.WriteBytesLong(this.ToClient, bytes, cur);
                cur += 8;
                break;
            case MessageType.Pool:
            case MessageType.PoolAll:
                if (this.ToPool != null) {
                    this.WriteBytesInt(this.ToPool.length, bytes, cur);
                }
                cur += 4;
                if (this.ToPool != null) {
                    this.WriteBytesUtf8(this.ToPool, bytes, cur);
                    cur += this.ToPool.length;
                }
                break;
        }
        this.WriteBytesInt(this.Method.length, bytes, cur);
        cur += 4;
        this.WriteBytesUtf8(this.Method, bytes, cur);
        cur += this.Method.length;
        if (this.Json != null) {
            this.WriteBytesInt(this.Json.length, bytes, cur);
            cur += 4;
            this.WriteBytesUtf8(this.Json, bytes, cur);
            cur += this.Json.length;
        }
        else {
            cur += 4;
        }
        this.WriteBytesLong(this.RequestKey, bytes, cur);
        cur += 8;
        this.WriteBytesInt(this.PoolAllCount, bytes, cur);
        cur += 4;
        if (bytes.length > 1024 * 1024 * 5) {
            throw "The message is longer than 5mb.";
        }
        return bytes;
    };
    Message.prototype.WriteBytesUtf8 = function (value, buffer, offset) {
        var b = value.split('').map(function (x) { return x.charCodeAt(0); });
        for (var i = 0; i < b.length; i++) {
            buffer[i + offset] = b[i];
        }
    };
    Message.ReadBytesUtf8 = function (buffer, offset, len) {
        return new Buffer(buffer.slice(offset, offset + len)).toString("utf8");
    };
    Message.prototype.WriteBytesInt = function (value, buffer, offset) {
        for (var index = 0; index < 4; index++) {
            var byte = value & 0xff;
            buffer[offset + index] = byte;
            value = (value - byte) / 256;
        }
    };
    Message.ReadBytesInt = function (uint, offset) {
        var dataView = new DataView(uint.buffer, offset);
        return dataView.getInt32(0, true);
    };
    Message.prototype.WriteBytesLong = function (value, buffer, offset) {
        var buff = new Int64LE(value).toArray();
        for (var index = 0; index < 8; index++) {
            buffer[offset + index] = buff[index];
        }
    };
    Message.ReadBytesLong = function (uint, offset) {
        var value = new Int64LE(uint, offset).toNumber();
        return value;
    };
    Message.Parse = function (bytes) {
        try {
            var message = new Message();
            var cur = 4;
            message.Direction = bytes[cur++];
            message.Type = bytes[cur++];
            message.ResponseOptions = bytes[cur++];
            message.From = this.ReadBytesLong(bytes, cur);
            cur += 8;
            switch (message.Type) {
                case MessageType.Client:
                    message.ToClient = this.ReadBytesLong(bytes, cur);
                    cur += 8;
                    break;
                case MessageType.Pool:
                case MessageType.PoolAll:
                    var toPoolLength = this.ReadBytesInt(bytes, cur);
                    cur += 4;
                    message.ToPool = this.ReadBytesUtf8(bytes, cur, toPoolLength);
                    cur += toPoolLength;
                    break;
            }
            var methodLength = this.ReadBytesInt(bytes, cur);
            cur += 4;
            message.Method = this.ReadBytesUtf8(bytes, cur, methodLength);
            cur += methodLength;
            var jsonLength = this.ReadBytesInt(bytes, cur);
            cur += 4;
            if (jsonLength > 0) {
                message.Json = this.ReadBytesUtf8(bytes, cur, jsonLength);
                cur += jsonLength;
            }
            message.RequestKey = this.ReadBytesLong(bytes, cur);
            cur += 8;
            message.PoolAllCount = this.ReadBytesInt(bytes, cur);
            cur += 4;
            return message;
        }
        catch (ex) {
            console.log("Failed Receive message:");
            console.log("" + new Buffer(bytes).toString("utf8"));
            console.log("" + ex);
            return null;
        }
    };
    Message.BuildServerRequest = function (method, options) {
        if (options === void 0) { options = ResponseOptions.SingleResponse; }
        var q = new Message();
        q.Method = method;
        q.Direction = MessageDirection.Request;
        q.Type = MessageType.Server;
        q.ResponseOptions = options;
        return q;
    };
    Message.prototype.GetJson = function () {
        if (this.Json)
            return JSON.parse(this.Json);
        return null;
    };
    return Message;
}());
exports.Message = Message;
var ResponseOptions;
(function (ResponseOptions) {
    ResponseOptions[ResponseOptions["SingleResponse"] = 1] = "SingleResponse";
    ResponseOptions[ResponseOptions["OpenResponse"] = 2] = "OpenResponse";
})(ResponseOptions = exports.ResponseOptions || (exports.ResponseOptions = {}));
var MessageDirection;
(function (MessageDirection) {
    MessageDirection[MessageDirection["Request"] = 1] = "Request";
    MessageDirection[MessageDirection["Response"] = 2] = "Response";
})(MessageDirection = exports.MessageDirection || (exports.MessageDirection = {}));
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Client"] = 1] = "Client";
    MessageType[MessageType["Pool"] = 2] = "Pool";
    MessageType[MessageType["PoolAll"] = 3] = "PoolAll";
    MessageType[MessageType["Server"] = 4] = "Server";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVzc2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tb24vTWVzc2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFHOUM7SUFZSTtRQVhPLGFBQVEsR0FBUyxDQUFDLENBQUMsQ0FBQztRQUVwQixTQUFJLEdBQVMsQ0FBQyxDQUFDLENBQUM7UUFPaEIsaUJBQVksR0FBUyxDQUFDLENBQUMsQ0FBQztJQUcvQixDQUFDO0lBR00seUJBQU8sR0FBZCxVQUFrQixHQUFNO1FBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSwwQkFBUSxHQUFmO1FBR0ksSUFBTSxlQUFlLEdBQUcsQ0FBQyxFQUNyQixLQUFLLEdBQUcsQ0FBQyxFQUNULElBQUksR0FBRyxDQUFDLEVBQ1IsUUFBUSxHQUFHLENBQUMsRUFDWixTQUFTLEdBQUcsQ0FBQyxFQUNiLFNBQVMsR0FBRyxDQUFDLEVBQ2IsT0FBTyxHQUFHLENBQUMsRUFDWCxVQUFVLEdBQUcsQ0FBQyxFQUNkLFlBQVksR0FBRyxDQUFDLENBQUM7UUFFckIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLE9BQU8sSUFBSSxlQUFlLENBQUM7UUFDM0IsT0FBTyxJQUFJLEtBQUssQ0FBQztRQUNqQixPQUFPLElBQUksSUFBSSxDQUFDO1FBQ2hCLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLEtBQUssV0FBVyxDQUFDLE1BQU07Z0JBQ25CLE9BQU8sSUFBSSxRQUFRLENBQUM7Z0JBQ3BCLEtBQUssQ0FBQztZQUNWLEtBQUssV0FBVyxDQUFDLElBQUksQ0FBQztZQUN0QixLQUFLLFdBQVcsQ0FBQyxPQUFPO2dCQUNwQixPQUFPLElBQUksU0FBUyxDQUFDO2dCQUNyQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO29CQUNaLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDbEMsS0FBSyxDQUFDO1FBQ1YsQ0FBQztRQUNELE9BQU8sSUFBSSxTQUFTLENBQUM7UUFDckIsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBRTlCLE9BQU8sSUFBSSxPQUFPLENBQUM7UUFDbkIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDWixPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDaEMsQ0FBQztRQUVELE9BQU8sSUFBSSxVQUFVLENBQUM7UUFDdEIsT0FBTyxJQUFJLFlBQVksQ0FBQztRQUd4QixJQUFJLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVwQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDeEMsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNULEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDOUIsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN6QixLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0MsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNULE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLEtBQUssV0FBVyxDQUFDLE1BQU07Z0JBQ25CLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQy9DLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQ1QsS0FBSyxDQUFDO1lBQ1YsS0FBSyxXQUFXLENBQUMsSUFBSSxDQUFDO1lBQ3RCLEtBQUssV0FBVyxDQUFDLE9BQU87Z0JBQ3BCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDdEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZELENBQUM7Z0JBQ0QsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDVCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ3RCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQzdDLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxLQUFLLENBQUM7UUFDVixDQUFDO1FBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDbkQsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNULElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0MsR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBRTFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNqRCxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ1QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzQyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDNUIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNiLENBQUM7UUFFRCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pELEdBQUcsSUFBSSxDQUFDLENBQUM7UUFFVCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2xELEdBQUcsSUFBSSxDQUFDLENBQUM7UUFFVCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxNQUFNLGlDQUFpQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFHTyxnQ0FBYyxHQUF0QixVQUF1QixLQUFhLEVBQUUsTUFBa0IsRUFBRSxNQUFjO1FBQ3BFLElBQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBZixDQUFlLENBQUMsQ0FBQztRQUN0RCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNoQyxNQUFNLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QixDQUFDO0lBQ0wsQ0FBQztJQUVjLHFCQUFhLEdBQTVCLFVBQTZCLE1BQWtCLEVBQUUsTUFBYyxFQUFFLEdBQVc7UUFDeEUsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRU8sK0JBQWEsR0FBckIsVUFBc0IsS0FBYSxFQUFFLE1BQWtCLEVBQUUsTUFBYztRQUNuRSxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ3JDLElBQUksSUFBSSxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDeEIsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDOUIsS0FBSyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUNqQyxDQUFDO0lBQ0wsQ0FBQztJQUNhLG9CQUFZLEdBQTFCLFVBQTJCLElBQWdCLEVBQUUsTUFBYztRQUN2RCxJQUFJLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2pELE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQTtJQUNwQyxDQUFDO0lBRU8sZ0NBQWMsR0FBdEIsVUFBdUIsS0FBYSxFQUFFLE1BQWtCLEVBQUUsTUFBYztRQUNwRSxJQUFJLElBQUksR0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQUNyQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLENBQUM7SUFDTCxDQUFDO0lBQ2MscUJBQWEsR0FBNUIsVUFBNkIsSUFBZ0IsRUFBRSxNQUFjO1FBQ3pELElBQUksS0FBSyxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksRUFBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoRCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFHYSxhQUFLLEdBQW5CLFVBQW9CLEtBQWlCO1FBQ2pDLElBQUksQ0FBQztZQUVELElBQUksT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7WUFFNUIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBRVosT0FBTyxDQUFDLFNBQVMsR0FBcUIsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDbkQsT0FBTyxDQUFDLElBQUksR0FBZ0IsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDekMsT0FBTyxDQUFDLGVBQWUsR0FBb0IsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDeEQsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM5QyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBRVQsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLEtBQUssV0FBVyxDQUFDLE1BQU07b0JBQ2YsT0FBTyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDdEQsR0FBRyxJQUFJLENBQUMsQ0FBQztvQkFDVCxLQUFLLENBQUM7Z0JBQ1YsS0FBSyxXQUFXLENBQUMsSUFBSSxDQUFDO2dCQUN0QixLQUFLLFdBQVcsQ0FBQyxPQUFPO29CQUNoQixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDckQsR0FBRyxJQUFJLENBQUMsQ0FBQztvQkFDVCxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztvQkFDOUQsR0FBRyxJQUFJLFlBQVksQ0FBQztvQkFDcEIsS0FBSyxDQUFDO1lBQ1YsQ0FBQztZQUdELElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2pELEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDVCxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUM5RCxHQUFHLElBQUksWUFBWSxDQUFDO1lBRXBCLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQy9DLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFFVCxFQUFFLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakIsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzFELEdBQUcsSUFBSSxVQUFVLENBQUM7WUFDdEIsQ0FBQztZQUVELE9BQU8sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDcEQsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUNULE9BQU8sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDckQsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUVULE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFJbkIsQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDVixPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFHLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUcsQ0FBQyxDQUFDO1lBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBRyxFQUFJLENBQUMsQ0FBQztZQUNyQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7SUFFTCxDQUFDO0lBRWEsMEJBQWtCLEdBQWhDLFVBQWlDLE1BQWMsRUFDM0MsT0FBeUQ7UUFBekQsd0JBQUEsRUFBQSxVQUEyQixlQUFlLENBQUMsY0FBYztRQUN6RCxJQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztRQUM1QixDQUFDLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQztRQUM1QixNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQUVNLHlCQUFPLEdBQWQ7UUFDSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ1YsTUFBTSxDQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUNMLGNBQUM7QUFBRCxDQUFDLEFBak9ELElBaU9DO0FBak9ZLDBCQUFPO0FBbU9wQixJQUFZLGVBR1g7QUFIRCxXQUFZLGVBQWU7SUFDdkIseUVBQWtCLENBQUE7SUFDbEIscUVBQWdCLENBQUE7QUFDcEIsQ0FBQyxFQUhXLGVBQWUsR0FBZix1QkFBZSxLQUFmLHVCQUFlLFFBRzFCO0FBRUQsSUFBWSxnQkFHWDtBQUhELFdBQVksZ0JBQWdCO0lBQ3hCLDZEQUFXLENBQUE7SUFDWCwrREFBWSxDQUFBO0FBQ2hCLENBQUMsRUFIVyxnQkFBZ0IsR0FBaEIsd0JBQWdCLEtBQWhCLHdCQUFnQixRQUczQjtBQUVELElBQVksV0FLWDtBQUxELFdBQVksV0FBVztJQUNuQixpREFBVSxDQUFBO0lBQ1YsNkNBQVEsQ0FBQTtJQUNSLG1EQUFXLENBQUE7SUFDWCxpREFBVSxDQUFBO0FBQ2QsQ0FBQyxFQUxXLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBS3RCIn0=