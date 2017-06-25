"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Pool = (function () {
    function Pool(poolName) {
        this.onMessage = [];
        this.PoolName = poolName;
    }
    Pool.prototype.ReceiveMessage = function (from, message, respond) {
        this.invokeMessage(from, message, respond);
    };
    Pool.prototype.OnMessage = function (callback) {
        this.onMessage.push(callback);
    };
    Pool.prototype.invokeMessage = function (from, message, respond) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i](from, message, respond);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0E7SUFJSSxjQUFZLFFBQWdCO1FBSHBCLGNBQVMsR0FBZ0IsRUFBRSxDQUFDO1FBSWhDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0lBQzdCLENBQUM7SUFFTSw2QkFBYyxHQUFyQixVQUFzQixJQUFZLEVBQUUsT0FBZ0IsRUFBRSxPQUF1QjtRQUN6RSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVNLHdCQUFTLEdBQWhCLFVBQWlCLFFBQW1CO1FBQ2hDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFTSw0QkFBYSxHQUFwQixVQUFxQixJQUFZLEVBQUUsT0FBZ0IsRUFBRSxPQUF1QjtRQUN4RSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzlDLENBQUM7SUFDTCxDQUFDO0lBRUwsV0FBQztBQUFELENBQUMsQUF0QkQsSUFzQkM7QUF0Qlksb0JBQUk7QUF3QmpCO0lBR0ksZ0JBQVksUUFBZ0I7UUFDeEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUM7SUFDdkIsQ0FBQztJQUNMLGFBQUM7QUFBRCxDQUFDLEFBTkQsSUFNQztBQU5ZLHdCQUFNIn0=