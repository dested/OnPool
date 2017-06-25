export class Query {
    public To: string;
    public From: string;
    public Type: QueryType;
    public Direction: QueryDirection;
    public ResponseOptions: ResponseOptions;
    public Method: string;
    public RequestKey: string;
    private QueryParams: QueryParam[];

    constructor() {
        this.QueryParams = [];
    }

    public Contains(key: string): boolean {
        return this.QueryParams.filter(a => a.Key === key).length > 0;
    }

    public Get(key: string): string {
        let queryParam = this.QueryParams.filter(a => a.Key === key)[0];
        if (queryParam)
            return queryParam.Value;
        return null;
    }

    public Add(key: string, value: string = ""): Query {
        this.QueryParams.push(new QueryParam(key, value));
        return this;
    }

    public AddJson<T>(obj: T): Query {
        this.QueryParams.push(new QueryParam("Json", JSON.stringify(obj)));
        return this;
    }

    public Remove(key: string): void {
        for (let i = this.QueryParams.length - 1; i >= 0; i--) {
            if (this.QueryParams[i].Key === key) {
                this.QueryParams.splice(i, 1);
            }
        }
    }

    public GetBytes(): Uint8Array {
        let sb = "";
        if (this.To) sb += (this.To);
        sb += ("|");
        if (this.From) sb += (this.From);
        sb += ("|");
        if (this.RequestKey) sb += (this.RequestKey);
        sb += ("|");
        sb += (this.Method);
        sb += ("?");
        for (let query of this.QueryParams) {
            sb += (query.Key);
            sb += ("=");
            sb += (encodeURIComponent(query.Value));
            sb += ("&");
        }
        const bytes = new Uint8Array(sb.length + 3 + 1);
        bytes[0] = <number>this.Direction;
        bytes[1] = <number>this.Type;
        bytes[2] = <number>this.ResponseOptions;

        const b = sb.split('').map((x) => x.charCodeAt(0));

        for (let i = 0; i < b.length; i++) {
            bytes[i + 3] = b[i];
        }

        return bytes;
    }

    public static Parse(continueBuffer: Uint8Array): Query {
        try {
            const direction: QueryDirection = <QueryDirection>continueBuffer[0];
            const type: QueryType = <QueryType>continueBuffer[1];
            const responseOptions: ResponseOptions = <ResponseOptions>continueBuffer[2];


            const pieces = new Buffer(continueBuffer.slice(3)).toString("utf8").split('|');
            const messageSplit = pieces[3].split('?');
            const queryParams: QueryParam[] = [];
            if (messageSplit.length === 2) {
                const split = messageSplit[1].split('&');
                for (let i = 0; i < split.length; i++) {
                    const querySplit = split[i].split('=');
                    if (querySplit) {
                        queryParams.push(new QueryParam(querySplit[0], decodeURIComponent(querySplit[1])));
                    }
                }
            }
            const query = new Query();
            query.Direction = direction;
            query.Method = messageSplit[0];
            query.Type = type;
            query.ResponseOptions = responseOptions;
            query.QueryParams = queryParams;
            if (pieces[0])
                query.To = pieces[0];
            if (pieces[1])
                query.From = pieces[1];
            if (pieces[2])
                query.RequestKey = pieces[2];
            return query;
        }
        catch (ex) {
            console.log("Failed Receive message:");
            console.log(`${new Buffer(continueBuffer).toString("utf8")}`);
            console.log(`${ex}`);
            return null;
        }

    }

    public static BuildServerRequest(method: string, options: ResponseOptions = ResponseOptions.SingleResponse): Query {
        let q = new Query();
        q.Method = method;
        q.Direction = QueryDirection.Request;
        q.Type = QueryType.Server;
        q.ResponseOptions = options;
        return q;
    }

    public ToString(): string {
        let sb = "";
        sb += (this.Method);
        sb += ("?");
        this.QueryParams.forEach(query => {
            sb += (query.Key);
            sb += ("=");
            sb += (encodeURIComponent(query.Value));
            sb += ("&");
        });
        sb += (this.Direction);
        sb += ("/");
        sb += (this.Type);
        sb += ("|");
        sb += (this.To);
        sb += ("|");
        sb += (this.From);
        sb += ("|");
        sb += (this.RequestKey);
        sb += ("|");
        sb += (this.ResponseOptions);
        return sb;
    }

    public GetJson<T>(): T {
        if (this.Contains("Json"))
            return <T>JSON.parse(this.Get("Json"));
        return null;
    }
}

export class QueryParam {
    constructor(key: string, value: any) {
        this.Key = key;
        this.Value = value.toString();
    }

    public Key: string;
    public Value: string;
}

export enum ResponseOptions {
    SingleResponse = 1,
    OpenResponse = 2
}

export enum QueryDirection {
    Request = 1,
    Response = 2
}

export enum QueryType {
    Client = 1,
    Pool = 2,
    PoolAll = 3,
    Server = 4
}
