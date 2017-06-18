import { ClientPool } from "./clientPool";
import { ClientConnection } from "./common/clientConnection";
import { Query, QueryParam } from "./common/query";
import { GetPoolByNameResponse } from "./models/GetPoolByNameResponse";
import { GetAllPoolsResponse } from "./models/GetAllPoolsResponse";

export class ClientBrokerManager {
    private pools: ClientPool[] = [];
    public client: ClientConnection;

    public get MySwimmerId(): string {
        return this.client.Id;
    }

    private onReady: (() => void)[] = [];
    private onDisconnect: (() => void)[] = [];
    private onMessage: ((query: Query) => void)[] = [];
    private onMessageWithResponse: ((query: Query, callback: (query: Query) => void) => void)[] = [];

    public ConnectToBroker(ip: string): void {
        this.client = new ClientConnection("127.0.0.1");
        this.client.OnMessage.push((_, message) => this.onReceiveMessage(message));
        this.client.OnMessageWithResponse.push((_, message, respond) => this.onReceiveMessageWithResponse(message, respond));
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

    public OnMessage(call: (query: Query) => void): void {
        this.onMessage.push(call);
    }

    public OnMessageWithResponse(callback: (query: Query, respond: (query: Query) => void) => void): void {
        this.onMessageWithResponse.push(callback);
    }

    private onReceiveMessageWithResponse(query: Query, respond: (query: Query) => void): void {
        if (query.Contains("~ToSwimmer~")) {
            this.invokeMessageWithResponse(query, respond);
            return
        }
        if (query.Contains("~ToPool~")) {
            let pool = this.pools.filter(a => a.PoolName == query.get("~ToPool~"))[0];
            pool && pool.invokeMessageWithResponse(query, respond);
            return;
        }
        if (query.Contains("~ToPoolAll~")) {
            let pool = this.pools.filter(a => a.PoolName == query.get("~ToPoolAll~"))[0];
            pool &&
                pool.invokeMessageWithResponse(query,
                    (res) => {
                        res.Add("~PoolAllCount~", query.get("~PoolAllCount~"));
                        respond(res);
                    });
            return;
        }
    }

    private onReceiveMessage(query: Query): void {
        if (query.Contains("~ToSwimmer~")) {
            this.invokeMessage(query);
            return
        }
        if (query.Contains("~ToPool~")) {
            let pool = this.pools.filter(a => a.PoolName == query.get("~ToPool~"))[0];
            pool && pool.invokeMessage(query);
            return;
        }
        if (query.Contains("~ToPoolAll~")) {
            let pool = this.pools.filter(a => a.PoolName == query.get("~ToPoolAll~"))[0];
            pool && pool.invokeMessage(query);
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
                pool.NumberOfSwimmers = getPoolByNameResponse.NumberOfSwimmers;
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

    private invokeMessageWithResponse(query: Query, respond: (query: Query) => void) {
        for (var i = 0; i < this.onMessageWithResponse.length; i++) {
            this.onMessageWithResponse[i](query, respond);
        }
    }

    private invokeMessage(query: Query) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](query);
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