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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var clientBrokerManager_1 = require("./clientBrokerManager");
var query_1 = require("./common/query");
var tests_1 = require("./tests");
var shouldRunTests = true;
if (shouldRunTests) {
    var runTests = function () { return __awaiter(_this, void 0, void 0, function () {
        var tests, ex_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tests = new tests_1.Tests();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, tests.run(tests.TestSwimmerResponse)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, tests.run(tests.TestPoolResponse)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, tests.run(tests.TestAllPoolResponse)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, tests.run(tests.Test100ClientsAll)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    ex_1 = _a.sent();
                    console.error(ex_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    runTests();
}
else {
    var c_1 = new clientBrokerManager_1.ClientBrokerManager();
    c_1.ConnectToBroker("127.0.0.1");
    c_1.OnDisconnect(function () {
    });
    c_1.OnMessage(function (from, message) {
        console.log(message.ToString());
    });
    c_1.OnMessageWithResponse(function (from, message, respond) {
        console.log(message.ToString());
        respond(query_1.Query.BuildWithJson("Baz", 12));
    });
    c_1.OnReady(function () {
        c_1.GetPool("GameServers", function (pool) {
            pool.OnMessage(function (from, message) {
                console.log(message.ToString());
            });
            pool.OnMessageWithResponse(function (from, message, respond) {
                console.log(message.ToString());
                respond(query_1.Query.BuildWithJson("Baz", 12));
            });
            pool.JoinPool(function () {
                pool.SendMessage(query_1.Query.Build("CreateGame", new query_1.QueryParam("Name", "B")));
                pool.SendAllMessage(query_1.Query.Build("WakeUp"));
                pool.SendMessageWithResponse(query_1.Query.Build("CreateName"), function (message) {
                });
                pool.SendAllMessageWithResponse(query_1.Query.Build("WakeUp"), function (message) {
                });
            });
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkFnRUE7O0FBaEVBLDZEQUEwRDtBQUMxRCx3Q0FBaUQ7QUFDakQsaUNBQThCO0FBRzlCLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQztBQUUxQixFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLElBQUksUUFBUSxHQUFHO1lBQ1AsS0FBSzs7Ozs0QkFBRyxJQUFJLGFBQUssRUFBRTs7OztvQkFFeEIscUJBQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsRUFBQTs7b0JBQTFDLFNBQTBDLENBQUM7b0JBQzNDLHFCQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUE7O29CQUF2QyxTQUF1QyxDQUFDO29CQUN4QyxxQkFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxFQUFBOztvQkFBMUMsU0FBMEMsQ0FBQztvQkFDM0MscUJBQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsRUFBQTs7b0JBQXhDLFNBQXdDLENBQUM7Ozs7b0JBR3BDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBRSxDQUFDLENBQUM7Ozs7O1NBR3pCLENBQUM7SUFDRixRQUFRLEVBQUUsQ0FBQztBQUVmLENBQUM7QUFBQyxJQUFJLENBQUMsQ0FBQztJQUNKLElBQUksR0FBQyxHQUFHLElBQUkseUNBQW1CLEVBQUUsQ0FBQztJQUNsQyxHQUFDLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQy9CLEdBQUMsQ0FBQyxZQUFZLENBQUM7SUFDZixDQUFDLENBQUMsQ0FBQztJQUNILEdBQUMsQ0FBQyxTQUFTLENBQUMsVUFBQyxJQUFJLEVBQUMsT0FBTztRQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBRUgsR0FBQyxDQUFDLHFCQUFxQixDQUFDLFVBQUMsSUFBSSxFQUFDLE9BQU8sRUFBRSxPQUFPO1FBQzFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDaEMsT0FBTyxDQUFDLGFBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQyxDQUFDLENBQUM7SUFFSCxHQUFDLENBQUMsT0FBTyxDQUFDO1FBQ04sR0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQ25CLFVBQUEsSUFBSTtZQUNBLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBQyxJQUFJLEVBQUMsT0FBTztnQkFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFDLElBQUksRUFBQyxPQUFPLEVBQUUsT0FBTztnQkFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDaEMsT0FBTyxDQUFDLGFBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUMsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNWLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBSyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsSUFBSSxrQkFBVSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUUzQyxJQUFJLENBQUMsdUJBQXVCLENBQVMsYUFBSyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxVQUFDLE9BQU87Z0JBQ3hFLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQywwQkFBMEIsQ0FBUyxhQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFVBQUMsT0FBTztnQkFDdkUsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBRVgsQ0FBQyxDQUFDLENBQUM7QUFFUCxDQUFDIn0=