import { ClientBrokerManager} from "./clientBrokerManager";
import { Query, QueryParam } from "./common/query";
import {Tests} from "./tests";



async function runTests() {
    var tests = new Tests();
   try {
//       await tests.run(tests.TestSwimmerResponse);
//       await tests.run(tests.TestPoolResponse);
//       await tests.run(tests.TestAllPoolResponse);
//       await tests.run(tests.Test100ClientsAll);
       await tests.run(tests.TestSlammer);
   } catch (ex) {
       console.error(ex);
   }

}


runTests();

return;
let c = new ClientBrokerManager();
c.ConnectToBroker("127.0.0.1");
c.OnDisconnect(() => {});
c.OnMessage((message) => {
    console.log(message.ToString());
});

c.OnMessageWithResponse((message, respond) => {
    console.log(message.ToString());
    respond(Query.BuildWithJson("Baz", 12));
});

c.OnReady(() => {
    c.GetPool("GameServers",
        pool => {
            pool.OnMessage((message) => {
                console.log(message.ToString());
            });
            pool.OnMessageWithResponse((message, respond) => {
                console.log(message.ToString());
                respond(Query.BuildWithJson("Baz", 12));
            });

            pool.JoinPool(() => {
                pool.SendMessage(Query.Build("CreateGame", new QueryParam("Name", "B")));
                pool.SendAllMessage(Query.Build("WakeUp"));

                pool.SendMessageWithResponse<string>(Query.Build("CreateName"), (message) => {});
                pool.SendAllMessageWithResponse<string>(Query.Build("WakeUp"), (message) => {});
            });
        });

});
