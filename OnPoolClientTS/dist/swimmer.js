"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Swimmer = (function () {
    function Swimmer(clientPool, swimmerId) {
        this.Client = clientPool;
        this.Id = swimmerId;
    }
    Swimmer.prototype.SendMessage = function (query) {
        query.Add("~ToSwimmer~", this.Id);
        this.Client.SendMessage(query);
    };
    Swimmer.prototype.SendMessageWithResponse = function (query, callback) {
        query.Add("~ToSwimmer~", this.Id);
        this.Client.SendMessageWithResponse(query, function (response) {
            callback(response);
        });
    };
    return Swimmer;
}());
exports.Swimmer = Swimmer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3dpbW1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zd2ltbWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0E7SUFHSSxpQkFBWSxVQUF1QixFQUFFLFNBQWdCO1FBQ2pELElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUFDTSw2QkFBVyxHQUFsQixVQUFtQixLQUFZO1FBQzNCLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBQ00seUNBQXVCLEdBQTlCLFVBQStCLEtBQVksRUFBRSxRQUFtQztRQUM1RSxLQUFLLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsVUFBQyxRQUFRO1lBQ2hELFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDTCxjQUFDO0FBQUQsQ0FBQyxBQWpCRCxJQWlCQztBQWpCWSwwQkFBTyJ9