import { Message } from "./common/Message";
import { OnMessage, RespondMessage } from "./onPoolClient";

export class Pool {
    private onMessage: OnMessage[] = [];
    public PoolName: string;

    constructor(poolName: string) {
        this.PoolName = poolName;
    }

    public ReceiveMessage(from: Client, message: Message, respond: RespondMessage): void {
        this.invokeMessage(from, message, respond);
    }

    public OnMessage(callback: OnMessage): void {
        this.onMessage.push(callback);
    }

    public invokeMessage(from: Client, message: Message, respond: RespondMessage) {
        for (let i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](from, message, respond);
        }
    }

}

export class Client {
    public Id: number;

    constructor(clientId: number) {
        this.Id = clientId;
    }
}