var Int64LE = require("int64-buffer").Int64LE;


export class Message {
    public ToClient: number=-1;
    public ToPool: string;
    public From: number=-1;
    public Type: MessageType;
    public Direction: MessageDirection;
    public ResponseOptions: ResponseOptions;
    public Method: string;
    public RequestKey: number;
    public Json: string;
    public PoolAllCount: number=-1;

    constructor() {
    }


    public AddJson<T>(obj: T): Message {
        this.Json = JSON.stringify(obj);
        return this;
    }

    public GetBytes(): Uint8Array {


        const lengthOfPayload = 4,
            enums = 4,
            from = 8,
            toClient = 8,
            toPoolLen = 4,
            methodLen = 4,
            jsonLen = 4,
            requestKey = 8,
            poolAllCount = 4;

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

        let cur = 0;
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
        } else {
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
    }


    private WriteBytesUtf8(value: string, buffer: Uint8Array, offset: number): void {
        const b = value.split('').map((x) => x.charCodeAt(0));
        for (let i = 0; i < b.length; i++) {
            buffer[i + offset] = b[i];
        }
    }

    private static ReadBytesUtf8(buffer: Uint8Array, offset: number, len: number): string {
        return new Buffer(buffer.slice(offset, offset + len)).toString("utf8");
    }

    private WriteBytesInt(value: number, buffer: Uint8Array, offset: number): void {
        for (var index = 0; index < 4; index++) {
            var byte = value & 0xff;
            buffer[offset + index] = byte;
            value = (value - byte) / 256;
        }
    }
    public static ReadBytesInt(uint: Uint8Array, offset: number): number {
        let dataView = new DataView(uint.buffer, offset);
        return dataView.getInt32(0,true)
    }

    private WriteBytesLong(value: number, buffer: Uint8Array, offset: number): void {
        let buff=new Int64LE(value).toArray()
        for (var index = 0; index < 8; index++) {
            buffer[offset + index] = buff[index];
        }
    }
    private static ReadBytesLong(uint: Uint8Array, offset: number): number {
        let value = new Int64LE(uint,offset).toNumber();
        return value;
    }
     

    public static Parse(bytes: Uint8Array): Message {
        try {

            var message = new Message();

            let cur = 4;

            message.Direction = <MessageDirection>bytes[cur++];
            message.Type = <MessageType>bytes[cur++];
            message.ResponseOptions = <ResponseOptions>bytes[cur++];
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


 
        } catch (ex) {
            console.log("Failed Receive message:");
            console.log(`${new Buffer(bytes).toString("utf8")}`);
            console.log(`${ex}`);
            return null;
        }

    }

    public static BuildServerRequest(method: string,
        options: ResponseOptions = ResponseOptions.SingleResponse): Message {
        let q = new Message();
        q.Method = method;
        q.Direction = MessageDirection.Request;
        q.Type = MessageType.Server;
        q.ResponseOptions = options;
        return q;
    }

    public GetJson<T>(): T {
        if (this.Json)
            return <T>JSON.parse(this.Json);
        return null;
    }
}

export enum ResponseOptions {
    SingleResponse = 1,
    OpenResponse = 2
}

export enum MessageDirection {
    Request = 1,
    Response = 2
}

export enum MessageType {
    Client = 1,
    Pool = 2,
    PoolAll = 3,
    Server = 4
}