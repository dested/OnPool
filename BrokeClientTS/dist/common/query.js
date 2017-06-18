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
            sb += this.QueryParams[key];
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
                    qparams.push(new QueryParam(querySplit[0], querySplit[1]));
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