"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Pool = (function () {
    function Pool(poolName) {
        this.onMessage = [];
        this.PoolName = poolName;
    }
    Pool.prototype.ReceiveMessage = function (from, query, respond) {
        this.invokeMessage(from, query, respond);
    };
    Pool.prototype.OnMessage = function (callback) {
        this.onMessage.push(callback);
    };
    Pool.prototype.invokeMessage = function (from, query, respond) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](from, query, respond);
        }
    };
    return Pool;
}());
exports.Pool = Pool;
var Client = (function () {
    function Client(clientId) {
        this.Id = clientId;
    }
    return Client;
}());
exports.Client = Client;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0E7SUFJSSxjQUFZLFFBQWdCO1FBSHBCLGNBQVMsR0FBZ0IsRUFBRSxDQUFDO1FBSWhDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0lBQzdCLENBQUM7SUFFTSw2QkFBYyxHQUFyQixVQUFzQixJQUFZLEVBQUUsS0FBWSxFQUFFLE9BQXVCO1FBQ3JFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRU0sd0JBQVMsR0FBaEIsVUFBaUIsUUFBbUI7UUFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVNLDRCQUFhLEdBQXBCLFVBQXFCLElBQVksRUFBRSxLQUFZLEVBQUUsT0FBdUI7UUFDcEUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1QyxDQUFDO0lBQ0wsQ0FBQztJQUVMLFdBQUM7QUFBRCxDQUFDLEFBdEJELElBc0JDO0FBdEJZLG9CQUFJO0FBd0JqQjtJQUdJLGdCQUFZLFFBQWdCO1FBQ3hCLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDO0lBQ3ZCLENBQUM7SUFDTCxhQUFDO0FBQUQsQ0FBQyxBQU5ELElBTUM7QUFOWSx3QkFBTSJ9