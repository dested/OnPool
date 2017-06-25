import { Query,  QueryDirection, ResponseOptions, QueryType } from "./common/query";
import { Client, Pool } from "./pool";
import { GetAllPoolsResponse } from "./models/GetAllPoolsResponse";
import { SocketManager } from "./common/socketManager";
import { GetClientByPoolResponse } from "./models/GetClientByPoolResponse";
import { Utils } from "./common/utils";
export type RespondMessage = (payload: any) => void;
export type OnMessage = (from: Client, message: Query, respond: RespondMessage) => void;

export class OnPoolClient {
    private pools: Pool[] = [];
    private clients: Client[] = [];
    public socketManager: SocketManager;

    public get MySwimmerId(): string {
        return this.socketManager.Id;
    }
    poolAllCounter: { [key: string]: number } = {};
    messageResponses: { [key: string]: (query: Query) => void } = {};


    private onReady: (() => void)[] = [];
    private onDisconnect: (() => void)[] = [];
    private onMessage: OnMessage[] = [];

    public ConnectToServer(ip: string): void {
        this.socketManager = new SocketManager(ip);
        this.socketManager.onReceive = (from, query) => this.messageProcess(query);
        this.socketManager.OnDisconnect.push(_ => this.invokeDisconnect());
        this.socketManager.StartFromClient();
        this.GetClientId((id) => {
            this.socketManager.Id = id;
            this.invokeReady();
        });
    }

    private messageProcess(message: Query): void {
        let fromClient: Client;
        if (message.From != null)
            fromClient = this.GetClientById(message.From);
        else fromClient = this.GetClientById(this.socketManager.Id);
        switch (message.Direction) {
            case QueryDirection.Request:
                const receiptId = message.RequestKey;
                this.onReceiveMessage(fromClient, message, queryResponse => {
                    const q = new Query();
                    q.Method = message.Method;
                    q.Direction = QueryDirection.Response;
                    q.Type = message.Type;
                    q.AddJson(queryResponse);
                    q.ResponseOptions = message.ResponseOptions;
                    q.To = fromClient.Id;
                    q.RequestKey = receiptId;
                    if (message.PoolAllCount>-1) {
                        q.PoolAllCount = message.PoolAllCount;
                    }
                    this.socketManager.SendMessage(q);
                });
                break;
            case QueryDirection.Response:
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


    private onReceiveMessage(from: Client, query: Query, respond: RespondMessage): void {
        switch (query.Type) {
            case QueryType.Client:
                this.invokeMessage(from, query, respond);
                return;
            case QueryType.Pool:
                {
                    let pool = this.pools.filter(a => a.PoolName === query.To)[0];

                    pool && pool.ReceiveMessage(from, query, respond);
                    return;
                }
            case QueryType.PoolAll:
                {
                    let pool = this.pools.filter(a => a.PoolName === query.To)[0];
                    pool && pool.ReceiveMessage(from, query, respond);
                }
                break;
            default:
                throw "Type not found: " + query;
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
        const query = Query.BuildServerRequest("GetClientId");
        this.sendMessage(query, callback);
    }
    public GetAllPools(poolName: string, callback: (_: GetAllPoolsResponse) => void): void {
        const query = Query.BuildServerRequest("GetAllPools");
        this.sendMessage(query, callback);
    }
    public OnPoolUpdated(poolName: string, callback: (_: Client[]) => void): void {
        const query = Query.BuildServerRequest("OnPoolUpdated", ResponseOptions.OpenResponse);
        query.AddJson(poolName);
        this.sendMessage<GetClientByPoolResponse>(query,
            response => {
                callback(response.Clients.map(a => this.GetClientById(a.Id)));
            });
    }
    public GetClients(poolName: string, callback: (_: Client[]) => void): void {
        const query = Query.BuildServerRequest("GetClients");
        query.AddJson(poolName);
        this.sendMessage<GetClientByPoolResponse>(query,
            response => {
                callback(response.Clients.map(a => this.GetClientById(a.Id)));
            });
    }
    public JoinPool(poolName: string): Pool {
        const pool = new Pool(poolName);
        this.pools.push(pool);
        const query = Query.BuildServerRequest("JoinPool");
        query.AddJson(poolName);
        this.sendMessage<Object>(query);
        return pool;
    }
    public LeavePool(poolName: string): void {
        const query = Query.BuildServerRequest("LeavePool");
        query.AddJson(poolName);
        this.sendMessage<Object>(query, response => {
            for (let i = this.pools.length - 1; i >= 0; i--) {
                const pool = this.pools[i];
                if (pool.PoolName === poolName) {
                    this.pools.splice(i, 1);
                }
            }
        });
    }
    public SendClientMessage<T>(clientId: string, method: string, payload: Object, callback: (_: T) => void = null, responseOptions: ResponseOptions = ResponseOptions.SingleResponse): void {
        const q = new Query();
        q.Method = method;
        q.Direction = QueryDirection.Request;
        q.Type = QueryType.Client;
        q.To = clientId;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        q.Type = QueryType.Client;
        this.sendMessage(q, callback);
    }
    public SendPoolMessage<T>(poolName: string, method: string, payload: Object, callback: (_: T) => void = null, responseOptions: ResponseOptions = ResponseOptions.SingleResponse): void {

        const q = new Query();
        q.Method = method;
        q.Direction = QueryDirection.Request;
        q.Type = QueryType.Pool;
        q.To = poolName;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        this.sendMessage(q, callback);
    }
    public SendAllPoolMessage<T>(poolName: string, method: string, payload: Object, callback: (_: T) => void = null, responseOptions: ResponseOptions = ResponseOptions.SingleResponse): void {
        const q = new Query();
        q.Method = method;
        q.Direction = QueryDirection.Request;
        q.Type = QueryType.PoolAll;
        q.To = poolName;
        q.ResponseOptions = responseOptions;
        q.AddJson(payload);
        this.sendMessage(q, callback);
    }


    public Disconnect(): void {
        this.socketManager.ForceDisconnect();
    }
    public sendMessage<T>(query: Query, callback: (_: T) => void = null): boolean {
        const responseKey = Utils.guid();
        query.RequestKey = responseKey;
        this.messageResponses[responseKey] = (payload) => {
            callback && callback(payload.GetJson<T>());
        };
        if (this.socketManager.Id != null && query.From == null)
            query.From = this.socketManager.Id;
        return this.socketManager.SendMessage(query);
    }

    private invokeMessage(from: Client, message: Query, respond: RespondMessage) {
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