import { Tests } from "./tests";

let shouldRunTests = true;

if (shouldRunTests) {
    let runTests = async () => {
        const tc = new Tests();


        const tests: ((success: () => void, fail: (reason: string) => void) => void)[] = [];
        for (let i: number = 0; i < 10; i++) {
            tests.push(...[
                tc.TestEveryone,
                tc.Test100ClientsAll,
                tc.TestFastestPool,
                tc.TestLeavePool,
                tc.TestOnPoolUpdatedResponse,
                tc.TestOnPoolDisconnectedResponse,
                tc.TestClientResponse,
                tc.TestPoolResponse,
                tc.TestDirectClientResponse,
                tc.TestAllPoolResponse,
                tc.TestClientSendObject,
                tc.TestPoolToClient
            ]);

        }
        tests.push(tc.TestSlammer);

        try {
            for (let j = 0; j < tests.length; j++) {
                await tc.run(tests[j]);
            }
        } catch (ex) {
            console.error(ex);
        }

    };
    runTests();

} 


