import {Query} from "./query";
import * as net from "net";
import {Utils} from "./utils";

export class ClientConnection {
    public Id: string;
    private disconnected: boolean = false;
    private serverIp: string;
    public OnDisconnect: ((client: ClientConnection) => void)[] = [];
    public OnMessage: ((client: ClientConnection, query: Query) => void)[] = [];
    public OnMessageWithResponse: ((client: ClientConnection, query: Query, response: (query: Query) => void) => void)[] = [];
    client: net.Socket;


    poolAllCounter: { [key: string]: number } = {};
    messageResponses: { [key: string]: (query: Query) => void } = {};

    constructor(serverIp: string) {
        this.serverIp = serverIp;
    }

    public StartFromClient(): void {
        this.client = new net.Socket();
        this.client.setKeepAlive(true);
        this.client.connect(1987, this.serverIp, () => {
            console.log('Connected');
        });

        let continueBuffer = '';
        this.client.on('data', (bytes: Uint8Array) => {
            let lastZero: number = 0;

            for (let j = 0; j < bytes.length; j++) {
                let b = bytes[j];
                if (b == 0) {
                    let piece = new Buffer(bytes.slice(lastZero, j - 1));
                    let str: string = piece.toString("ascii");
                    lastZero = j + 1;
                    this.ReceiveResponse(continueBuffer + str);
                    continueBuffer = "";
                }
            }
            if (lastZero != bytes.length) {
                let piece = new Buffer(bytes.slice(lastZero, bytes.length));
                let str: string = piece.toString("ascii");
                continueBuffer += str;
            }

        });

        this.client.on('close', () => {
            console.log('Connection closed');
        });
    }


    public SendMessageWithResponse(message: Query, callback: (query: Query) => void): boolean {
        var responseKey = Utils.guid();
        message.Add("~ResponseKey~", responseKey);
        this.messageResponses[responseKey] = callback;
        return this.SendMessage(message);
    }

    public SendMessage(message: Query): boolean {
        if (this.client.destroyed) {
            this.Disconnect();
            return false;
        }

        try {
            this.client.write(message.ToString() + "\0");
        }
        catch (ex) {
            console.log(`Send exception: ${ex}`);
            this.Disconnect();
            return false;
        }

        return true;
    }

    private ReceiveResponse(payload: string): void {
        var query = Query.Parse(payload);
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


            for (let i = 0; i < this.OnMessageWithResponse.length; i++) {
                this.OnMessageWithResponse[i](this, query, (queryResponse) => {
                    queryResponse.Add("~Response~");
                    queryResponse.Add("~ResponseKey~", receiptId);
                    this.SendMessage(queryResponse);
                });
            }

        }
        else {
            for (let i = 0; i < this.OnMessage.length; i++) {
                this.OnMessage[i](this, query);
            }
        }

    }

    public ForceDisconnect(): void {
        this.client.destroy();
        this.Disconnect();
    }

    private Disconnect(): void {
        if (this.disconnected) {
            return;
        }
        this.disconnected = true;
        for (let i = 0; i < this.OnDisconnect.length; i++) {
            this.OnDisconnect[i](this);
        }
    }
}