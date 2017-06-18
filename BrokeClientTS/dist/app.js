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
                    //       await tests.run(tests.TestPoolResponse);
                    //       await tests.run(tests.TestAllPoolResponse);
                    //       await tests.run(tests.Test100ClientsAll);
                    return [4 /*yield*/, tests.run(tests.TestSlammer)];
                case 2:
                    //       await tests.run(tests.TestSwimmerResponse);
                    //       await tests.run(tests.TestPoolResponse);
                    //       await tests.run(tests.TestAllPoolResponse);
                    //       await tests.run(tests.Test100ClientsAll);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNkRBQTJEO0FBQzNELHdDQUFtRDtBQUNuRCxpQ0FBOEI7QUFJOUI7O1lBQ1EsS0FBSzs7Ozs0QkFBRyxJQUFJLGFBQUssRUFBRTs7OztvQkFFM0Isb0RBQW9EO29CQUNwRCxpREFBaUQ7b0JBQ2pELG9EQUFvRDtvQkFDcEQsa0RBQWtEO29CQUMzQyxxQkFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBQTs7b0JBSnpDLG9EQUFvRDtvQkFDcEQsaURBQWlEO29CQUNqRCxvREFBb0Q7b0JBQ3BELGtEQUFrRDtvQkFDM0MsU0FBa0MsQ0FBQzs7OztvQkFFbkMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFFLENBQUMsQ0FBQzs7Ozs7O0NBR3hCO0FBR0QsUUFBUSxFQUFFLENBQUM7QUFFWCxNQUFNLENBQUM7QUFDUCxJQUFJLENBQUMsR0FBRyxJQUFJLHlDQUFtQixFQUFFLENBQUM7QUFDbEMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUMsWUFBWSxDQUFDLGNBQU8sQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFDLE9BQU87SUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQztBQUVILENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxVQUFDLE9BQU8sRUFBRSxPQUFPO0lBQ3JDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDaEMsT0FBTyxDQUFDLGFBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDNUMsQ0FBQyxDQUFDLENBQUM7QUFFSCxDQUFDLENBQUMsT0FBTyxDQUFDO0lBQ04sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQ25CLFVBQUEsSUFBSTtRQUNBLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBQyxPQUFPO1lBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBQyxPQUFPLEVBQUUsT0FBTztZQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sQ0FBQyxhQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNWLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBSyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsSUFBSSxrQkFBVSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFM0MsSUFBSSxDQUFDLHVCQUF1QixDQUFTLGFBQUssQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsVUFBQyxPQUFPLElBQU0sQ0FBQyxDQUFDLENBQUM7WUFDakYsSUFBSSxDQUFDLDBCQUEwQixDQUFTLGFBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsVUFBQyxPQUFPLElBQU0sQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUVYLENBQUMsQ0FBQyxDQUFDIn0=