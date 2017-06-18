import {ClientPool} from "./clientPool";
import {Query} from "./common/query";
import {SwimmerResponse} from "./models/SwimmerResponse";

export class ClientPoolSwimmer {
    private clientPool: ClientPool;
    public Id: string;
    constructor(clientPool: ClientPool, a: SwimmerResponse) {
        this.clientPool = clientPool;
        this.Id = a.Id;
    }
    public SendMessage(query: Query): void {
        query.Add("~ToSwimmer~", this.Id);
        this.clientPool.clientBrokerManager.client.SendMessage(query);
    }
    public SendMessageWithResponse<T>(query: Query, callback: (response: T) => void): void {
        query.Add("~ToSwimmer~", this.Id);
        this.clientPool.clientBrokerManager.client.SendMessageWithResponse(query, (response) => {
            callback(response.GetJson<T>());
        });
    }
}