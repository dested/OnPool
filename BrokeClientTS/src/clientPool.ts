import {ClientBrokerManager} from "./clientBrokerManager";
import {Query, QueryParam} from "./common/query";
import {GetPoolByNameResponse} from "./models/GetPoolByNameResponse";
import {ClientPoolSwimmer} from "./clientPoolSwimmer";
import {GetSwimmerByPoolResponse} from "./models/GetSwimmerByPoolResponse";

export class ClientPool {
    public clientBrokerManager: ClientBrokerManager;
    public PoolName: string;
    public NumberOfSwimmers: number;
    public onMessage: ((query: Query) => void)[]=[];
    public onMessageWithResponse: ((query: Query, callback: (response: Query) => void) => void)[]=[];

    public OnMessage(callback: (response: Query) => void): void {
        this.onMessage.push(callback);
    }

    public OnMessageWithResponse(callback: (query: Query, callback: (response: Query) => void) => void): void {
        this.onMessageWithResponse.push(callback);
    }

    constructor(clientBrokerManager: ClientBrokerManager, response: GetPoolByNameResponse) {
        this.clientBrokerManager = clientBrokerManager;
        this.PoolName = response.PoolName;
        this.NumberOfSwimmers = response.NumberOfSwimmers;
    }

    public GetSwimmers(callback: (_: ClientPoolSwimmer[]) => void): void {
        var query = Query.Build("GetSwimmers", new QueryParam("PoolName", this.PoolName));
        this.clientBrokerManager.client.SendMessageWithResponse(query,
            (response) => {
                callback((response.GetJson < GetSwimmerByPoolResponse>()).Swimmers
                    .map(a => new ClientPoolSwimmer(this, a)));
            });
    }

    public JoinPool(callback: () => void): void {
        this.clientBrokerManager.client.SendMessageWithResponse(
            Query.Build("JoinPool", new QueryParam("PoolName", this.PoolName)),
            (response) => {
                callback();
            });
    }

    public SendMessage(query: Query): void {
        query.Add("~ToPool~", this.PoolName);
        this.clientBrokerManager.client.SendMessage(query);
    }

    public SendAllMessage(query: Query): void {
        query.Add("~ToPoolAll~", this.PoolName);
        this.clientBrokerManager.client.SendMessage(query);
    }

    public SendMessageWithResponse<T>(query: Query, callback: (resp: T) => void): void {
        query.Add("~ToPool~", this.PoolName);
        this.clientBrokerManager.client.SendMessageWithResponse(query,
            (response) => {
                callback(response.GetJson<T>());
            });
    }

    public SendAllMessageWithResponse<T>(query: Query, callback: (_: T) => void): void {
        query.Add("~ToPoolAll~", this.PoolName);
        this.clientBrokerManager.client.SendMessageWithResponse(query,
            (response) => {
                callback(response.GetJson<T>());
            });
    }

    public invokeMessageWithResponse(query: Query, respond: (query: Query) => void) {
        for (var i = 0; i < this.onMessageWithResponse.length; i++) {
            this.onMessageWithResponse[i](query, respond);
        }
    }

    public invokeMessage(query: Query) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](query);
        }
    }
}