import { Message,  MessageDirection, ResponseOptions, MessageType } from "./common/Message";
import { Client, Pool } from "./pool";
import { GetAllPoolsResponse } from "./models/GetAllPoolsResponse";
import { SocketManager } from "./common/socketManager";
import { GetClientByPoolResponse } from "./models/GetClientByPoolResponse";
import { Utils } from "./common/utils";
export type RespondMessage = (payload: any) => void;
export type OnMessage = (from: Client, message: Message, respond: RespondMessage) => void;

export class OnPoolClient {
    private pools: Pool[] = [];
    private clients: Client[] = [];
    public socketManager: SocketManager;

    public get MySwimmerId(): string {
        return this.socketManager.Id;
    }
    poolAllCounter: { [key: string]: number } = {};
    messageResponses: { [key: string]: (message: Message) => void } = {};


    private onReady: (() => void)[] = [];
    private onDisconnect: (() => void)[] = [];
    private onMessage: OnMessage[] = [];

    public ConnectToServer(ip: string): void {
        this.socketManager = new SocketManager(ip);
        this.socketManager.onReceive = (from, message) => this.messageProcess(message);
        this.socketManager.OnDisconnect.push(_ => this.invokeDisconnect());
        this.socketManager.StartFromClient();
        this.GetClientId((id) => {
            this.socketManager.Id = id;
            this.invokeReady();
        });
    }

    private messageProcess(message: Message): void {
        let fromClient: Client;
        if (message.From != null)
            fromClient = this.GetClientById(message.From);
        else fromClient = this.GetClientById(this.socketManager.Id);
        switch (message.Direction) {
            case MessageDirection.Request:
                const receiptId = message.RequestKey;
                this.onReceiveMessage(fromClient, message, messageResponse => {
                    const q = new Message();
                    q.Method = message.Method;
                    q.Direction = MessageDirection.Response;
                    q.Type = message.Type;
                    q.AddJson(messageResponse);
                    q.ResponseOptions = message.ResponseOptions;
                    q.To = fromClient.Id;
                    q.RequestKey = receiptId;
                    if (message.PoolAllCount>-1) {
                        q.PoolAllCount = message.PoolAllCount;
                    }
                    this.socketManager.SendMessage(q);
                });
                break;
            case MessageDirection.Response:
                if (this.messageResponses[message.RequestKey]) {
                    const callback = this.messageResponses[message.RequestKey];
                    if (message.ResponseOptions === ResponseOptions.SingleResponse) {
                        if (message.PoolAllCount>-1) {
                            if (!this.poolAllCounter[message.RequestKey])
                                this.poolAllCounter[message.RequestKey] = 1;
                            else this.poolAllCounter[message.RequestKey] = this.poolAllCounter[message.RequestKey] + 1;
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
    }


    private onReceiveMessage(from: Client, message: Message, respond: RespondMessage): void {
        switch (message.Type) {
            case MessageType.Client:
                this.invokeMessage(from, message, respond);
                return;
            case MessageType.Pool:
                {
                    let pool = this.pools.filter(a => a.PoolName === message.To)[0];

                    pool && pool.ReceiveMessage(from, message, respond);
                    return;
                }
            case MessageType.PoolAll:
                {
                    let pool = this.pools.filter(a => a.PoolName === message.To)[0];
                    pool && pool.ReceiveMessage(from, message, respond);
                }
                break;
            default:
                throw "Type not found: " + message;
        }
    }
    private GetClientById(id: string): Client {
        let client = this.clients.filter(a => a.Id == id)[0];
        if (!client) {
            client = new Client(id);
            this.clients.push(client);
        }
        return client;
    }
    public OnReady(callback: () => void): void {
        this.onReady.push(callback);
    }
    public OnDisconnect(callback: () => void): void {
        this.onDisconnect.push(callback);
    }
    public OnMessage(callback: OnMessage): void {
        this.onMessage.push(callback);
    }
    public GetClientId(callback: (_: string) => void): void {
        const message = Message.BuildServerRequest("GetClientId");
        this.sendMessage(message, callback);
    }
    public GetAllPools(poolName: string, callback: (_: GetAllPoolsResponse) => void): void {
        const message = Message.BuildServerRequest("GetAllPools");
        this.sendMessage(message, callback);
    }
    public OnPoolUpdated(poolName: string, callback: (_: Client[]) => void): void {
        const message = Message.BuildServerRequest("OnPoolUpdated", ResponseOptions.OpenResponse);
        message.AddJson(poolName);
        this.sendMessage<GetClientByPoolResponse>(message,
            response => {
                callback(response.Clients.map(a => this.GetClientById(a.Id)));
            });
    }
    public GetClients(poolName: string, callback: (_: Client[]) => void): void {
        const message = Message.BuildServerRequest("GetClients");
        message.AddJson(poolName);
        this.sendMessage<GetClientByPoolResponse>(message,
            response => {
                callback(response.Clients.map(a => this.GetClientById(a.Id)));
            });
    }
    public JoinPool(poolName: string): Pool {
        const pool = new Pool(poolName);
        this.pools.push(pool);
        const message = Message.BuildServerRequest("JoinPool");
        message.AddJson(poolName);
        this.sendMessage<void>(message);
        return pool;
    }
    public LeavePool(poolName: string): void {
        const message = Message.BuildServerRequest("LeavePool");
        message.AddJson(poolName);
        this.sendMessage<void>(message, response => {
            for (let i = this.pools.length - 1; i >= 0; i--) {
                const pool = this.pools[i];
                if (pool.PoolName === poolName) {
                    this.pools.splice(i, 1);
                }
            }
        });
    }
    public SendClientMessage<T>(clientId: string, method: string, payload: any, callback: (_: T) => void = null, responseOptions: ResponseOptions = ResponseOptions.SingleResponse): void {
        const q = new Message();
        q.Method = method;
        q.Direction = MessageDirection.Request;
        q.Type = MessageType.Client;
        q.To = clientId;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload); 
        this.sendMessage(q, callback);
    }
    public SendPoolMessage<T>(poolName: string, method: string, payload: any, callback: (_: T) => void = null, responseOptions: ResponseOptions = ResponseOptions.SingleResponse): void {

        const q = new Message();
        q.Method = method;
        q.Direction = MessageDirection.Request;
        q.Type = MessageType.Pool;
        q.To = poolName;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        this.sendMessage(q, callback);
    }
    public SendAllPoolMessage<T>(poolName: string, method: string, payload: any, callback: (_: T) => void = null, responseOptions: ResponseOptions = ResponseOptions.SingleResponse): void {
        const q = new Message();
        q.Method = method;
        q.Direction = MessageDirection.Request;
        q.Type = MessageType.PoolAll;
        q.To = poolName;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        this.sendMessage(q, callback);
    }


    public Disconnect(): void {
        this.socketManager.ForceDisconnect();
    }
    public sendMessage<T>(message: Message, callback: (_: T) => void = null): boolean {
        const responseKey = Utils.guid();
        message.RequestKey = responseKey;
        this.messageResponses[responseKey] = (payload) => {
            callback && callback(payload.GetJson<T>());
        };
        if (this.socketManager.Id != null && message.From == null)
            message.From = this.socketManager.Id;
        return this.socketManager.SendMessage(message);
    }

    private invokeMessage(from: Client, message: Message, respond: RespondMessage) {
        for (let i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](from, message, respond);
        }
    }

    private invokeDisconnect() {
        for (let i = 0; i < this.onDisconnect.length; i++) {
            this.onDisconnect[i]();
        }
    }

    private invokeReady() {
        for (let i = 0; i < this.onReady.length; i++) {
            this.onReady[i]();
        }
    }

}