export class Query{


    constructor(method: string, ...queryParams: QueryParam[]) {
        this.Method = method;

        this.QueryParams = {};
        for (let i = 0; i < queryParams.length; i++) {
            let qp = queryParams[i];
            this.QueryParams[qp.Key] = qp.Value;
        }
    } /*
    constructor(query: Query) {
        this.Method = query.Method;
        this.QueryParams = new Dictionary<string, string>(query.QueryParams);
    }*/

    public Method: string;
    private QueryParams: { [key: string]: string };

    public Contains(key: string): boolean {
        return !(this.QueryParams[key]===undefined);
    }

    public Add(key: string, value: string=""): void {
        this.QueryParams[key] = value;
    }

    public Remove(key: string): void {
        delete this.QueryParams[key];
    }

    public ToString(): string {
        let sb = "";
        sb += (this.Method);
        sb += ("?");
        for (let key in this.QueryParams) {
            sb += key;
            sb += "=";
            sb += encodeURIComponent(this.QueryParams[key]);
            sb += "&";
        }
        return sb;
    }

    public static Build(method: string, ...queryParams: QueryParam[]): Query {
        return new Query(method, ...queryParams);
    }

    public static BuildWithJson<T>(method: string, json: T, ...queryParams: QueryParam[]): Query {
        let qp = [new QueryParam("Json", JSON.stringify(json))]
        qp.push(...queryParams);
        return new Query(method, ...qp);
    }


    public static Parse(message: string): Query {
        let messageSplit = message.split('?');
        let qparams: QueryParam[] = [];
        if (messageSplit.length === 2)
            messageSplit[1].split('&').forEach((s) => {
                if (s.length > 0) {
                    let querySplit = s.split('=');
                    qparams.push(new QueryParam(querySplit[0], decodeURIComponent(querySplit[1])));
                }
            });
        return new Query(messageSplit[0], ...qparams);
    }

    public Respond(...queryParams: QueryParam[]): Query {
        return new Query(this.Method, ...queryParams);
    }

    public RespondWithJson<T>(json: T, ...queryParams: QueryParam[]): Query {
        let qp = [new QueryParam("Json", JSON.stringify(json))];
        qp.push(...queryParams);
        return new Query(this.Method, ...qp);
    }

    public GetJson<T>(): T {
        if (this.Contains("Json")) {
            return JSON.parse(this.QueryParams["Json"]) as T;
        }
        return null;
    }

    get(key: string): string { return this.QueryParams[key]; }
}

export class QueryParam {
    constructor(key: string, value: any) {
        this.Key = key;
        this.Value = value + "";
    }

    public Key: string;
    public Value: string;
}
/*
    
*/