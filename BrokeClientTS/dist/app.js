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
                    _a.trys.push([1, 3, , 4]);
                    // await tests.run(tests.TestSwimmerResponse);
                    // await tests.run(tests.TestPoolResponse);
                    // await tests.run(tests.TestAllPoolResponse);
                    // await tests.run(tests.Test100ClientsAll);
                    return [4 /*yield*/, tests.run(tests.TestSlammer)];
                case 2:
                    // await tests.run(tests.TestSwimmerResponse);
                    // await tests.run(tests.TestPoolResponse);
                    // await tests.run(tests.TestAllPoolResponse);
                    // await tests.run(tests.Test100ClientsAll);
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    ex_1 = _a.sent();
                    console.error(ex_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkFnRUE7O0FBaEVBLDZEQUEwRDtBQUMxRCx3Q0FBaUQ7QUFDakQsaUNBQThCO0FBRzlCLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQztBQUUxQixFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLElBQUksUUFBUSxHQUFHO1lBQ1AsS0FBSzs7Ozs0QkFBRyxJQUFJLGFBQUssRUFBRTs7OztvQkFFeEIsOENBQThDO29CQUM5QywyQ0FBMkM7b0JBQzNDLDhDQUE4QztvQkFDOUMsNENBQTRDO29CQUN4QyxxQkFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBQTs7b0JBSnRDLDhDQUE4QztvQkFDOUMsMkNBQTJDO29CQUMzQyw4Q0FBOEM7b0JBQzlDLDRDQUE0QztvQkFDeEMsU0FBa0MsQ0FBQzs7OztvQkFFbEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFFLENBQUMsQ0FBQzs7Ozs7U0FHekIsQ0FBQztJQUNGLFFBQVEsRUFBRSxDQUFDO0FBRWYsQ0FBQztBQUFDLElBQUksQ0FBQyxDQUFDO0lBQ0osSUFBSSxHQUFDLEdBQUcsSUFBSSx5Q0FBbUIsRUFBRSxDQUFDO0lBQ2xDLEdBQUMsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDL0IsR0FBQyxDQUFDLFlBQVksQ0FBQztJQUNmLENBQUMsQ0FBQyxDQUFDO0lBQ0gsR0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFDLElBQUksRUFBQyxPQUFPO1FBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDcEMsQ0FBQyxDQUFDLENBQUM7SUFFSCxHQUFDLENBQUMscUJBQXFCLENBQUMsVUFBQyxJQUFJLEVBQUMsT0FBTyxFQUFFLE9BQU87UUFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNoQyxPQUFPLENBQUMsYUFBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsQ0FBQztJQUVILEdBQUMsQ0FBQyxPQUFPLENBQUM7UUFDTixHQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFDbkIsVUFBQSxJQUFJO1lBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFDLElBQUksRUFBQyxPQUFPO2dCQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQUMsSUFBSSxFQUFDLE9BQU8sRUFBRSxPQUFPO2dCQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNoQyxPQUFPLENBQUMsYUFBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFLLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxJQUFJLGtCQUFVLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBRTNDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxhQUFLLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFFLFVBQUMsT0FBTztnQkFDaEUsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLDBCQUEwQixDQUFDLGFBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsVUFBQyxPQUFPO2dCQUMvRCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFFWCxDQUFDLENBQUMsQ0FBQztBQUVQLENBQUMifQ==