import {Query} from "./common/query";
import {SocketLayer} from "./common/socketLayer";

export class Swimmer {
    private Client:SocketLayer;
    public Id: string;
    constructor(clientPool: SocketLayer, swimmerId:string) {
        this.Client = clientPool;
        this.Id = swimmerId;
    }
    public SendMessage(query: Query): void {
        query.Add("~ToSwimmer~", this.Id);
        this.Client.SendMessage(query);
    }
    public SendMessageWithResponse(query: Query, callback: (response: Query) => void): void {
        query.Add("~ToSwimmer~", this.Id);
        this.Client.SendMessageWithResponse(query, (response) => {
            callback(response);
        });
    }
}