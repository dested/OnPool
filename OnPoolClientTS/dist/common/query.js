"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Query = (function () {
    function Query(method) {
        var queryParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            queryParams[_i - 1] = arguments[_i];
        }
        this.Method = method;
        this.QueryParams = {};
        for (var i = 0; i < queryParams.length; i++) {
            var qp = queryParams[i];
            this.QueryParams[qp.Key] = qp.Value;
        }
    } /*
    constructor(query: Query) {
        this.Method = query.Method;
        this.QueryParams = new Dictionary<string, string>(query.QueryParams);
    }*/
    Query.prototype.Contains = function (key) {
        return !(this.QueryParams[key] === undefined);
    };
    Query.prototype.Add = function (key, value) {
        if (value === void 0) { value = ""; }
        this.QueryParams[key] = value;
    };
    Query.prototype.Remove = function (key) {
        delete this.QueryParams[key];
    };
    Query.prototype.ToString = function () {
        var sb = "";
        sb += (this.Method);
        sb += ("?");
        for (var key in this.QueryParams) {
            sb += key;
            sb += "=";
            sb += encodeURIComponent(this.QueryParams[key]);
            sb += "&";
        }
        return sb;
    };
    Query.Build = function (method) {
        var queryParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            queryParams[_i - 1] = arguments[_i];
        }
        return new (Query.bind.apply(Query, [void 0, method].concat(queryParams)))();
    };
    Query.BuildWithJson = function (method, json) {
        var queryParams = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            queryParams[_i - 2] = arguments[_i];
        }
        var qp = [new QueryParam("Json", JSON.stringify(json))];
        qp.push.apply(qp, queryParams);
        return new (Query.bind.apply(Query, [void 0, method].concat(qp)))();
    };
    Query.Parse = function (message) {
        var messageSplit = message.split('?');
        var qparams = [];
        if (messageSplit.length === 2)
            messageSplit[1].split('&').forEach(function (s) {
                if (s.length > 0) {
                    var querySplit = s.split('=');
                    qparams.push(new QueryParam(querySplit[0], decodeURIComponent(querySplit[1])));
                }
            });
        return new (Query.bind.apply(Query, [void 0, messageSplit[0]].concat(qparams)))();
    };
    Query.prototype.Respond = function () {
        var queryParams = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            queryParams[_i] = arguments[_i];
        }
        return new (Query.bind.apply(Query, [void 0, this.Method].concat(queryParams)))();
    };
    Query.prototype.RespondWithJson = function (json) {
        var queryParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            queryParams[_i - 1] = arguments[_i];
        }
        var qp = [new QueryParam("Json", JSON.stringify(json))];
        qp.push.apply(qp, queryParams);
        return new (Query.bind.apply(Query, [void 0, this.Method].concat(qp)))();
    };
    Query.prototype.GetJson = function () {
        if (this.Contains("Json")) {
            return JSON.parse(this.QueryParams["Json"]);
        }
        return null;
    };
    Query.prototype.get = function (key) { return this.QueryParams[key]; };
    return Query;
}());
exports.Query = Query;
var QueryParam = (function () {
    function QueryParam(key, value) {
        this.Key = key;
        this.Value = value + "";
    }
    return QueryParam;
}());
exports.QueryParam = QueryParam;
/*
    
*/ 
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbW9uL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7SUFHSSxlQUFZLE1BQWM7UUFBRSxxQkFBNEI7YUFBNUIsVUFBNEIsRUFBNUIscUJBQTRCLEVBQTVCLElBQTRCO1lBQTVCLG9DQUE0Qjs7UUFDcEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFckIsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDdEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDMUMsSUFBSSxFQUFFLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUM7UUFDeEMsQ0FBQztJQUNMLENBQUMsQ0FBQzs7OztPQUlDO0lBS0ksd0JBQVEsR0FBZixVQUFnQixHQUFXO1FBQ3ZCLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBRyxTQUFTLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRU0sbUJBQUcsR0FBVixVQUFXLEdBQVcsRUFBRSxLQUFnQjtRQUFoQixzQkFBQSxFQUFBLFVBQWdCO1FBQ3BDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ2xDLENBQUM7SUFFTSxzQkFBTSxHQUFiLFVBQWMsR0FBVztRQUNyQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVNLHdCQUFRLEdBQWY7UUFDSSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDWixFQUFFLElBQUksQ0FBQyxJ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