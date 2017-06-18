import {ClientBrokerManager} from "./clientBrokerManager";
import {Query, QueryParam} from "./common/query";
import {Tests} from "./tests";


let shouldRunTests = true;

if (shouldRunTests) {
    let runTests = async () => {
        var tests = new Tests();
        try {
       await tests.run(tests.TestSwimmerResponse);
       await tests.run(tests.TestPoolResponse);
       await tests.run(tests.TestAllPoolResponse);
       await tests.run(tests.Test100ClientsAll);
//            await tests.run(tests.TestSlammer);
        } catch (ex) {
            console.error(ex);
        }

    };
    runTests();

} else {
    let c = new ClientBrokerManager();
    c.ConnectToBroker("127.0.0.1");
    c.OnDisconnect(() => {
    });
    c.OnMessage((from,message) => {
        console.log(message.ToString());
    });

    c.OnMessageWithResponse((from,message, respond) => {
        console.log(message.ToString());
        respond(Query.BuildWithJson("Baz", 12));
    });

    c.OnReady(() => {
        c.GetPool("GameServers",
            pool => {
                pool.OnMessage((from,message) => {
                    console.log(message.ToString());
                });
                pool.OnMessageWithResponse((from,message, respond) => {
                    console.log(message.ToString());
                    respond(Query.BuildWithJson("Baz", 12));
                });

                pool.JoinPool(() => {
                    pool.SendMessage(Query.Build("CreateGame", new QueryParam("Name", "B")));
                    pool.SendAllMessage(Query.Build("WakeUp"));

                    pool.SendMessageWithResponse(Query.Build("CreateName"), (message) => {
                    });
                    pool.SendAllMessageWithResponse(Query.Build("WakeUp"), (message) => {
                    });
                });
            });

    });

}


