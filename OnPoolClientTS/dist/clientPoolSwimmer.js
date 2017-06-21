"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ClientPoolSwimmer = (function () {
    function ClientPoolSwimmer(clientPool, a) {
        this.clientPool = clientPool;
        this.Id = a.Id;
    }
    ClientPoolSwimmer.prototype.SendMessage = function (query) {
        query.Add("~ToSwimmer~", this.Id);
        this.clientPool.clientBrokerManager.client.SendMessage(query);
    };
    ClientPoolSwimmer.prototype.SendMessageWithResponse = function (query, callback) {
        query.Add("~ToSwimmer~", this.Id);
        this.clientPool.clientBrokerManager.client.SendMessageWithResponse(query, function (response) {
            callback(response.GetJson());
        });
    };
    return ClientPoolSwimmer;
}());
exports.ClientPoolSwimmer = ClientPoolSwimmer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50UG9vbFN3aW1tZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY2xpZW50UG9vbFN3aW1tZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJQTtJQUdJLDJCQUFZLFVBQXNCLEVBQUUsQ0FBa0I7UUFDbEQsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFDTSx1Q0FBVyxHQUFsQixVQUFtQixLQUFZO1FBQzNCLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUNNLG1EQUF1QixHQUE5QixVQUFrQyxLQUFZLEVBQUUsUUFBK0I7UUFDM0UsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxVQUFDLFFBQVE7WUFDL0UsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUssQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUNMLHdCQUFDO0FBQUQsQ0FBQyxBQWpCRCxJQWlCQztBQWpCWSw4Q0FBaUIifQ==