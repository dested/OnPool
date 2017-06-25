import { Query } from "./common/query";
import { OnMessage, RespondMessage } from "./onPoolClient";

export class Pool {
    private onMessage: OnMessage[] = [];
    public PoolName: string;

    constructor(poolName: string) {
        this.PoolName = poolName;
    }

    public ReceiveMessage(from: Client, query: Query, respond: RespondMessage): void {
        this.invokeMessage(from, query, respond);
    }

    public OnMessage(callback: OnMessage): void {
        this.onMessage.push(callback);
    }

    public invokeMessage(from: Client, query: Query, respond: RespondMessage) {
        for (let i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](from, query, respond);
        }
    }

}

export class Client {
    public Id: string;

    constructor(clientId: string) {
        this.Id = clientId;
    }
}