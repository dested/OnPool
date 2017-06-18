import {ClientPool} from "./clientPool";
import {ClientConnection, OnMessage, OnMessageWithResponse} from "./common/clientConnection";
import {Query, QueryParam} from "./common/query";
import {GetPoolByNameResponse} from "./models/GetPoolByNameResponse";
import {GetAllPoolsResponse} from "./models/GetAllPoolsResponse";

export class ClientBrokerManager {
    private pools: ClientPool[] = [];
    public client: ClientConnection;

    public get MySwimmerId(): string {
        return this.client.Id;
    }

    private onReady: (() => void)[] = [];
    private onDisconnect: (() => void)[] = [];
    private onMessage: OnMessage[] = [];
    private onMessageWithResponse: OnMessageWithResponse[] = [];

    public ConnectToBroker(ip: string): void {
        this.client = new ClientConnection("127.0.0.1");
        this.client.OnMessage.push((from, message) => this.onReceiveMessage(from, message));
        this.client.OnMessageWithResponse.push((from, message, respond) => this.onReceiveMessageWithResponse(from, message, respond));
        this.client.OnDisconnect.push(_ => this.invokeDisconnect());
        this.client.StartFromClient();

        this.GetSwimmerId((id) => {
            this.client.Id = id;
            this.invokeReady();
        });
    }

    public OnReady(callback: () => void): void {
        this.onReady.push(callback);
    }

    public OnDisconnect(callback: () => void): void {
        this.onDisconnect.push(callback);
    }

    public OnMessage(call: OnMessage): void {
        this.onMessage.push(call);
    }

    public OnMessageWithResponse(callback: OnMessageWithResponse): void {
        this.onMessageWithResponse.push(callback);
    }

    private onReceiveMessageWithResponse(from: ClientConnection, message: Query, respond: (query: Query) => void): void {
        if (message.Contains("~ToSwimmer~")) {
            this.invokeMessageWithResponse(from, message, respond);
            return
        }
        if (message.Contains("~ToPool~")) {
            let pool = this.pools.filter(a => a.PoolName == message.get("~ToPool~"))[0];
            pool && pool.invokeMessageWithResponse(from, message, respond);
            return;
        }
        if (message.Contains("~ToPoolAll~")) {
            let pool = this.pools.filter(a => a.PoolName == message.get("~ToPoolAll~"))[0];
            pool &&
            pool.invokeMessageWithResponse(from, message,
                (res) => {
                    res.Add("~PoolAllCount~", message.get("~PoolAllCount~"));
                    respond(res);
                });
            return;
        }
    }

    private onReceiveMessage(from: ClientConnection, message: Query): void {
        if (message.Contains("~ToSwimmer~")) {
            this.invokeMessage(from, message);
            return
        }
        if (message.Contains("~ToPool~")) {
            let pool = this.pools.filter(a => a.PoolName == message.get("~ToPool~"))[0];
            pool && pool.invokeMessage(from, message);
            return;
        }
        if (message.Contains("~ToPoolAll~")) {
            let pool = this.pools.filter(a => a.PoolName == message.get("~ToPoolAll~"))[0];
            pool && pool.invokeMessage(from, message);
            return;
        }
    }

    public GetSwimmerId(callback: (_: string) => void): void {
        var query = Query.Build("GetSwimmerId");
        this.client.SendMessageWithResponse(query,
            (response) => {
                callback(response.GetJson<string>());
            });
    }
    public SendMessage(swimmerId: string, query: Query): void {
        query.Add("~ToSwimmer~", swimmerId);
        this.client.SendMessage(query);
    }
    public SendMessageWithResponse<T>(swimmerId: string, query: Query, callback: (response: T) => void): void {
        query.Add("~ToSwimmer~", swimmerId);
        this.client.SendMessageWithResponse(query, (response) => {
            callback(response.GetJson<T>());
        });
    }
    public GetPool(poolName: string, callback: (_: ClientPool) => void): void {
        var query = Query.Build("GetPool", new QueryParam("PoolName", poolName));
        this.client.SendMessageWithResponse(query,
            (response) => {
                var getPoolByNameResponse = response.GetJson<GetPoolByNameResponse>();
                var pool: ClientPool = this.pools.filter(a => a.PoolName == getPoolByNameResponse.PoolName)[0];
                if (pool == null) {
                    this.pools.push(pool = new ClientPool(this, getPoolByNameResponse));
                }
                pool.PoolName = getPoolByNameResponse.PoolName;
                callback(pool);
            });
    }

    public GetAllPools(poolName: string, callback: (_: GetAllPoolsResponse) => void): void {
        var query = Query.Build("GetAllPools");
        this.client.SendMessageWithResponse(query,
            (response) => {
                callback(response.GetJson<GetAllPoolsResponse>());
            });
    }

    public Disconnet(): void {
        this.client.ForceDisconnect();
    }

    private invokeMessageWithResponse(from: ClientConnection, message: Query, respond: (query: Query) => void) {
        for (var i = 0; i < this.onMessageWithResponse.length; i++) {
            this.onMessageWithResponse[i](from, message, respond);
        }
    }

    private invokeMessage(from: ClientConnection, message: Query) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](from, message);
        }
    }

    private invokeDisconnect() {
        for (var i = 0; i < this.onDisconnect.length; i++) {
            this.onDisconnect[i]();
        }
    }

    private invokeReady() {
        for (var i = 0; i < this.onReady.length; i++) {
            this.onReady[i]();
        }
    }

}