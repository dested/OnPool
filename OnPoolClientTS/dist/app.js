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
var tests_1 = require("./tests");
var shouldRunTests = true;
if (shouldRunTests) {
    var runTests = function () { return __awaiter(_this, void 0, void 0, function () {
        var tc, tests, i, j, ex_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tc = new tests_1.Tests();
                    tests = [];
                    for (i = 0; i < 10; i++) {
                        tests.push.apply(tests, [
                            //                tc.TestEveryone,
                            tc.TestLeavePool,
                            tc.TestOnPoolUpdatedResponse,
                            tc.TestOnPoolDisconnectedResponse,
                            tc.TestClientResponse,
                            tc.TestPoolResponse,
                            tc.TestDirectClientResponse,
                            tc.TestAllPoolResponse,
                            tc.TestClientSendObject
                        ]);
                    }
                    tests.push(tc.TestSlammer);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    j = 0;
                    _a.label = 2;
                case 2:
                    if (!(j < tests.length)) return [3 /*break*/, 5];
                    return [4 /*yield*/, tc.run(tests[j])];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    j++;
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 7];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpQkF3Q0E7O0FBeENBLGlDQUFnQztBQUVoQyxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFFMUIsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUNqQixJQUFJLFFBQVEsR0FBRztZQUNMLEVBQUUsRUFHRixLQUFLLEVBQ0YsQ0FBQzs7Ozt5QkFKQyxJQUFJLGFBQUssRUFBRTs0QkFHMkQsRUFBRTtvQkFDbkYsR0FBRyxDQUFDLENBQUMsSUFBZ0IsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDbEMsS0FBSyxDQUFDLElBQUksT0FBVixLQUFLLEVBQVM7NEJBQzFCLGtDQUFrQzs0QkFDbEIsRUFBRSxDQUFDLGFBQWE7NEJBQ2hCLEVBQUUsQ0FBQyx5QkFBeUI7NEJBQzVCLEVBQUUsQ0FBQyw4QkFBOEI7NEJBQ2pDLEVBQUUsQ0FBQyxrQkFBa0I7NEJBQ3JCLEVBQUUsQ0FBQyxnQkFBZ0I7NEJBQ25CLEVBQUUsQ0FBQyx3QkFBd0I7NEJBQzNCLEVBQUUsQ0FBQyxtQkFBbUI7NEJBQ3RCLEVBQUUsQ0FBQyxvQkFBb0I7eUJBQzFCLEVBQUU7b0JBRVAsQ0FBQztvQkFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQzs7Ozt3QkFHVixDQUFDOzs7eUJBQUUsQ0FBQSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQTtvQkFDNUIscUJBQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQTs7b0JBQXRCLFNBQXNCLENBQUM7OztvQkFETyxDQUFDLEVBQUUsQ0FBQTs7Ozs7b0JBSXJDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBRSxDQUFDLENBQUM7Ozs7O1NBR3pCLENBQUM7SUFDRixRQUFRLEVBQUUsQ0FBQztBQUVmLENBQUMifQ==