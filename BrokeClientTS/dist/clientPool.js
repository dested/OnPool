"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var query_1 = require("./common/query");
var clientPoolSwimmer_1 = require("./clientPoolSwimmer");
var ClientPool = (function () {
    function ClientPool(clientBrokerManager, response) {
        this.onMessage = [];
        this.onMessageWithResponse = [];
        this.clientBrokerManager = clientBrokerManager;
        this.PoolName = response.PoolName;
        this.NumberOfSwimmers = response.NumberOfSwimmers;
    }
    ClientPool.prototype.OnMessage = function (callback) {
        this.onMessage.push(callback);
    };
    ClientPool.prototype.OnMessageWithResponse = function (callback) {
        this.onMessageWithResponse.push(callback);
    };
    ClientPool.prototype.GetSwimmers = function (callback) {
        var _this = this;
        var query = query_1.Query.Build("GetSwimmers", new query_1.QueryParam("PoolName", this.PoolName));
        this.clientBrokerManager.client.SendMessageWithResponse(query, function (response) {
            callback((response.GetJson()).Swimmers
                .map(function (a) { return new clientPoolSwimmer_1.ClientPoolSwimmer(_this, a); }));
        });
    };
    ClientPool.prototype.JoinPool = function (callback) {
        this.clientBrokerManager.client.SendMessageWithResponse(query_1.Query.Build("JoinPool", new query_1.QueryParam("PoolName", this.PoolName)), function (response) {
            callback();
        });
    };
    ClientPool.prototype.SendMessage = function (query) {
        query.Add("~ToPool~", this.PoolName);
        this.clientBrokerManager.client.SendMessage(query);
    };
    ClientPool.prototype.SendAllMessage = function (query) {
        query.Add("~ToPoolAll~", this.PoolName);
        this.clientBrokerManager.client.SendMessage(query);
    };
    ClientPool.prototype.SendMessageWithResponse = function (query, callback) {
        query.Add("~ToPool~", this.PoolName);
        this.clientBrokerManager.client.SendMessageWithResponse(query, function (response) {
            callback(response.GetJson());
        });
    };
    ClientPool.prototype.SendAllMessageWithResponse = function (query, callback) {
        query.Add("~ToPoolAll~", this.PoolName);
        this.clientBrokerManager.client.SendMessageWithResponse(query, function (response) {
            callback(response.GetJson());
        });
    };
    ClientPool.prototype.invokeMessageWithResponse = function (query, respond) {
        for (var i = 0; i < this.onMessageWithResponse.length; i++) {
            this.onMessageWithResponse[i](query, respond);
        }
    };
    ClientPool.prototype.invokeMessage = function (query) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](query);
        }
    };
    return ClientPool;
}());
exports.ClientPool = ClientPool;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50UG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnRQb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esd0NBQWlEO0FBRWpELHlEQUFzRDtBQUd0RDtJQWVJLG9CQUFZLG1CQUF3QyxFQUFFLFFBQStCO1FBWDlFLGNBQVMsR0FBNkIsRUFBRSxDQUFDO1FBQ3pDLDBCQUFxQixHQUFrRSxFQUFFLENBQUM7UUFXN0YsSUFBSSxDQUFDLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDO1FBQy9DLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztRQUNsQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDO0lBQ3RELENBQUM7SUFaTSw4QkFBUyxHQUFoQixVQUFpQixRQUFtQztRQUNoRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRU0sMENBQXFCLEdBQTVCLFVBQTZCLFFBQXFFO1FBQzlGLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQVFNLGdDQUFXLEdBQWxCLFVBQW1CLFFBQTBDO1FBQTdELGlCQU9DO1FBTkcsSUFBSSxLQUFLLEdBQUcsYUFBSyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsSUFBSSxrQkFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNsRixJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFDekQsVUFBQyxRQUFRO1lBQ0wsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBOEIsQ0FBQyxDQUFDLFFBQVE7aUJBQzdELEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLElBQUkscUNBQWlCLENBQUMsS0FBSSxFQUFFLENB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