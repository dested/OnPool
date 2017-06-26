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
            case MessageType.ClientPool:
                byteLen += toClient;
                byteLen += toPoolLen;
                if (this.ToPool)
                    byteLen += this.ToPool.length;
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
            case MessageType.ClientPool:
                this.WriteBytesLong(this.ToClient, bytes, cur);
                cur += 8;
                if (this.ToPool != null) {
                    this.WriteBytesInt(this.ToPool.length, bytes, cur);
                }
                cur += 4;
                if (this.ToPool != null) {
                    this.WriteBytesUtf8(this.ToPool, bytes, cur);
                    cur += this.ToPool.length;
                }
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
                    {
                        message.ToClient = this.ReadBytesLong(bytes, cur);
                        cur += 8;
                        break;
                    }
                case MessageType.ClientPool:
                    {
                        message.ToClient = this.ReadBytesLong(bytes, cur);
                        cur += 8;
                        var toPoolLength = this.ReadBytesInt(bytes, cur);
                        cur += 4;
                        message.ToPool = this.ReadBytesUtf8(bytes, cur, toPoolLength);
                        cur += toPoolLength;
                    }
                    break;
                case MessageType.Pool:
                case MessageType.PoolAll:
                    {
                        var toPoolLength = this.ReadBytesInt(bytes, cur);
                        cur += 4;
                        message.ToPool = this.ReadBytesUtf8(bytes, cur, toPoolLength);
                        cur += toPoolLength;
                    }
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
    MessageType[MessageType["ClientPool"] = 2] = "ClientPool";
    MessageType[MessageType["Pool"] = 3] = "Pool";
    MessageType[MessageType["PoolAll"] = 4] = "PoolAll";
    MessageType[MessageType["Server"] = 5] = "Server";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVzc2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tb24vTWVzc2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFHOUM7SUFZSTtRQVhPLGFBQVEsR0FBUyxDQUFDLENBQUMsQ0FBQztRQUVwQixTQUFJLEdBQVMsQ0FBQyxDQUFDLENBQUM7UUFPaEIsaUJBQVksR0FBUyxDQUFDLENBQUMsQ0FBQztJQUcvQixDQUFDO0lBR00seUJBQU8sR0FBZCxVQUFrQixHQUFNO1FBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSwwQkFBUSxHQUFmO1FBR0ksSUFBTSxlQUFlLEdBQUcsQ0FBQyxFQUNyQixLQUFLLEdBQUcsQ0FBQyxFQUNULElBQUksR0FBRyxDQUFDLEVBQ1IsUUFBUSxHQUFHLENBQUMsRUFDWixTQUFTLEdBQUcsQ0FBQyxFQUNiLFNBQVMsR0FBRyxDQUFDLEVBQ2IsT0FBTyxHQUFHLENBQUMsRUFDWCxVQUFVLEdBQUcsQ0FBQyxFQUNkLFlBQVksR0FBRyxDQUFDLENBQUM7UUFFckIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLE9BQU8sSUFBSSxlQUFlLENBQUM7UUFDM0IsT0FBTyxJQUFJLEtBQUssQ0FBQztRQUNqQixPQUFPLElBQUksSUFBSSxDQUFDO1FBQ2hCLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLEtBQUssV0FBVyxDQUFDLE1BQU07Z0JBQ25CLE9BQU8sSUFBSSxRQUFRLENBQUM7Z0JBQ3BCLEtBQUssQ0FBQztZQUNWLEtBQUssV0FBVyxDQUFDLFVBQVU7Z0JBQ3ZCLE9BQU8sSUFBSSxRQUFRLENBQUM7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