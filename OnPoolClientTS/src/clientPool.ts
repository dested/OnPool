import {ClientBrokerManager} from "./clientBrokerManager";
import {Query, QueryParam} from "./common/query";
import {GetPoolByNameResponse} from "./models/GetPoolByNameResponse";
import { Swimmer} from "./swimmer";
import {GetSwimmerByPoolResponse} from "./models/GetSwimmerByPoolResponse";
import {OnMessage, OnMessageWithResponse, SocketLayer} from "./common/socketLayer";

export class ClientPool {
    public clientBrokerManager: ClientBrokerManager;
    public PoolName: string;
    public onMessage: OnMessage[]=[];
    public onMessageWithResponse: OnMessageWithResponse[]=[];
    private _getSwimmer: (swimmerId: string) => Swimmer;

  
    constructor(clientBrokerManager: ClientBrokerManager, response: GetPoolByNameResponse, getSwimmer: (swimmerId: string) => Swimmer) {
        this.clientBrokerManager = clientBrokerManager;
        this.PoolName = response.PoolName;
        this._getSwimmer = getSwimmer;
    }
    public OnMessage(callback: OnMessage): void {
        this.onMessage.push(callback);
    }

    public OnMessageWithResponse(callback: OnMessageWithResponse): void {
        this.onMessageWithResponse.push(callback);
    }



    public GetSwimmers(callback: (_: Swimmer[]) => void): void {
        var query = Query.Build("GetSwimmers", new QueryParam("PoolName", this.PoolName));
        this.clientBrokerManager.client.SendMessageWithResponse(query,
            (response) => {
                callback((response.GetJson<GetSwimmerByPoolResponse>()).Swimmers
                    .map(a => this._getSwimmer(a.Id)));
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

    public SendMessageWithResponse(query: Query, callback: (message: Query) => void): void {
        query.Add("~ToPool~", this.PoolName);
        this.clientBrokerManager.client.SendMessageWithResponse(query,
            (response) => {
                callback(response);
            });
    }

    public SendAllMessageWithResponse(message: Query, callback: (message:Query) => void): void {
        message.Add("~ToPoolAll~", this.PoolName);
        this.clientBrokerManager.client.SendMessageWithResponse(message,
            (response) => {
                callback(response);
            });
    }

    public invokeMessageWithResponse(from: Swimmer, message: Query, respond: (query: Query) => void) {
        for (var i = 0; i < this.onMessageWithResponse.length; i++) {
            this.onMessageWithResponse[i](from,message, respond);
        }
    }

    public invokeMessage(from:Swimmer, message: Query) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](from,message);
        }
    }
}