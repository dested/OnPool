"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var query_1 = require("./common/query");
var ClientPool = (function () {
    function ClientPool(clientBrokerManager, response, getSwimmer) {
        this.onMessage = [];
        this.onMessageWithResponse = [];
        this.clientBrokerManager = clientBrokerManager;
        this.PoolName = response.PoolName;
        this._getSwimmer = getSwimmer;
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
                .map(function (a) { return _this._getSwimmer(a.Id); }));
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
            callback(response);
        });
    };
    ClientPool.prototype.SendAllMessageWithResponse = function (message, callback) {
        message.Add("~ToPoolAll~", this.PoolName);
        this.clientBrokerManager.client.SendMessageWithResponse(message, function (response) {
            callback(response);
        });
    };
    ClientPool.prototype.invokeMessageWithResponse = function (from, message, respond) {
        for (var i = 0; i < this.onMessageWithResponse.length; i++) {
            this.onMessageWithResponse[i](from, message, respond);
        }
    };
    ClientPool.prototype.invokeMessage = function (from, message) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](from, message);
        }
    };
    return ClientPool;
}());
exports.ClientPool = ClientPool;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50UG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnRQb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esd0NBQWlEO0FBTWpEO0lBUUksb0JBQVksbUJBQXdDLEVBQUUsUUFBK0IsRUFBRSxVQUEwQztRQUwxSCxjQUFTLEdBQWMsRUFBRSxDQUFDO1FBQzFCLDBCQUFxQixHQUEwQixFQUFFLENBQUM7UUFLckQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDO1FBQy9DLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztRQUNsQyxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUNsQyxDQUFDO0lBQ00sOEJBQVMsR0FBaEIsVUFBaUIsUUFBbUI7UUFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVNLDBDQUFxQixHQUE1QixVQUE2QixRQUErQjtRQUN4RCxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFJTSxnQ0FBVyxHQUFsQixVQUFtQixRQUFnQztRQUFuRCxpQkFPQztRQU5HLElBQUksS0FBSyxHQUFHLGFBQUssQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLElBQUksa0JBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbEYsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQ3pELFVBQUMsUUFBUTtZQUNMLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQTRCLENBQUMsQ0FBQyxRQUFRO2lCQUMzRCxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBdEIs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