"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var clientBrokerManager_1 = require("./clientBrokerManager");
var query_1 = require("./common/query");
var tests_1 = require("./tests");
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var tests, ex_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tests = new tests_1.Tests();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    //       await tests.run(tests.TestSwimmerResponse);
                    return [4 /*yield*/, tests.run(tests.TestPoolResponse)];
                case 2:
                    //       await tests.run(tests.TestSwimmerResponse);
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    ex_1 = _a.sent();
                    console.error(ex_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
runTests();
return;
var c = new clientBrokerManager_1.ClientBrokerManager();
c.ConnectToBroker("127.0.0.1");
c.OnDisconnect(function () { });
c.OnMessage(function (message) {
    console.log(message.ToString());
});
c.OnMessageWithResponse(function (message, respond) {
    console.log(message.ToString());
    respond(query_1.Query.BuildWithJson("Baz", 12));
});
c.OnReady(function () {
    c.GetPool("GameServers", function (pool) {
        pool.OnMessage(function (message) {
            console.log(message.ToString());
        });
        pool.OnMessageWithResponse(function (message, respond) {
            console.log(message.ToString());
            respond(query_1.Query.BuildWithJson("Baz", 12));
        });
        pool.JoinPool(function () {
            pool.SendMessage(query_1.Query.Build("CreateGame", new query_1.QueryParam("Name", "B")));
            pool.SendAllMessage(query_1.Query.Build("WakeUp"));
            pool.SendMessageWithResponse(query_1.Query.Build("CreateName"), function (message) { });
            pool.SendAllMessageWithResponse(query_1.Query.Build("WakeUp"), function (message) { });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNkRBQTJEO0FBQzNELHdDQUFtRDtBQUNuRCxpQ0FBOEI7QUFJOUI7O1lBQ1EsS0FBSzs7Ozs0QkFBRyxJQUFJLGFBQUssRUFBRTs7OztvQkFFM0Isb0RBQW9EO29CQUM3QyxxQkFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFBOztvQkFEOUMsb0RBQW9EO29CQUM3QyxTQUF1QyxDQUFDOzs7O29CQUl4QyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUUsQ0FBQyxDQUFDOzs7Ozs7Q0FHeEI7QUFHRCxRQUFRLEVBQUUsQ0FBQztBQUVYLE1BQU0sQ0FBQztBQUNQLElBQUksQ0FBQyxHQUFHLElBQUkseUNBQW1CLEVBQUUsQ0FBQztBQUNsQyxDQUFDLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxZQUFZLENBQUMsY0FBTyxDQUFDLENBQUMsQ0FBQztBQUN6QixDQUFDLENBQUMsU0FBUyxDQUFDLFVBQUMsT0FBTztJQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQ3BDLENBQUMsQ0FBQyxDQUFDO0FBRUgsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLFVBQUMsT0FBTyxFQUFFLE9BQU87SUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNoQyxPQUFPLENBQUMsYUFBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM1QyxDQUFDLENBQUMsQ0FBQztBQUVILENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDTixDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFDbkIsVUFBQSxJQUFJO1FBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFDLE9BQU87WUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFDLE9BQU8sRUFBRSxPQUFPO1lBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDaEMsT0FBTyxDQUFDLGFBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ1YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFLLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxJQUFJLGtCQUFVLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RSxJQUFJLENBQUMsY0FBYyxDQUFDLGFBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUUzQyxJQUFJLENBQUMsdUJBQXVCLENBQVMsYUFBSyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxVQUFDLE9BQU8sSUFBTSxDQUFDLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsMEJBQTBCLENBQVMsYUFBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxVQUFDLE9BQU8sSUFBTSxDQUFDLENBQUMsQ0FBQztRQUNwRixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBRVgsQ0FBQyxDQUFDLENBQUMifQ==