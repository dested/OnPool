using System;
using System.Collections;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using BrokerCommon;
using BrokerCommon.Models;
using Newtonsoft.Json;

namespace BrokerClient
{

    public delegate void GetPoolCallback(BrokerPool pool);
    public delegate void GetAllPoolsCallback(GetAllPoolsResponse response);
    public delegate void GetSwimmersCallback(BrokerPoolSwimmer[] swimmers);
    public delegate void JoinPoolCallback();


    public class ClientBrokerManager
    {
        internal ClientConnection client;

        public void ConnectToBroker(string ip)
        {
            client = new ClientConnection("127.0.0.1");
            client.OnMessage += (_, message) => OnMessage(message);
            client.OnDisconnect += _ => OnDisconnect?.Invoke();
            client.StartFromClient();
        }


        private void OnMessage(Query query)
        {
            switch (query.Method)
            {
                default: throw new Exception("Method not found: " + query.Method);
            }
        }

        public Action OnDisconnect { get; set; }

        public void GetPool(string poolName, GetPoolCallback callback)
        {
            var query = Query.Build("GetPool", new QueryParam("PoolName", poolName));

            client.SendMessageWithResponse(query, (response) =>
            {
                callback(new BrokerPool(this, response.GetJson<GetPoolByNameResponse>()));
            });
        }
        public void GetAllPools(string poolName, GetAllPoolsCallback callback)
        {
            var query = Query.Build("GetAllPools");

            client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<GetAllPoolsResponse>());
            });
        }
    }



    public class BrokerPool
    {
        internal readonly ClientBrokerManager clientBrokerManager;
        private bool joinedPool = false;
        public string PoolName { get; set; }
        public int NumberOfSwimmers { get; set; }
        public Action<string, string> OnMessage { get; set; }

        public BrokerPool(ClientBrokerManager clientBrokerManager, GetPoolByNameResponse response)
        {
            this.clientBrokerManager = clientBrokerManager;
            this.PoolName = response.PoolName;
            this.NumberOfSwimmers = response.NumberOfSwimmers;
        }

        public void GetSwimmers(GetSwimmersCallback callback)
        {
            var query = Query.Build("GetSwimmers", new QueryParam("PoolName", this.PoolName));

            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(
                    response.GetJson<GetSwimmerByPoolResponse>()
                    .Swimmers
                    .Select(a => new BrokerPoolSwimmer(this, a))
                    .ToArray()
                    );
            });

        }

        public void JoinPool(JoinPoolCallback callback)
        {
            var query = Query.Build("JoinPool", new QueryParam("PoolName", this.PoolName));

            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                this.joinedPool = true;
                callback();
            });
        }

        public void SendMessage(Query query)
        {
            query.AddQueryParam("~ToPool~", this.PoolName);
            clientBrokerManager.client.SendMessage(query);
        }
        public void SendAllMessage(Query query)
        {
            query.AddQueryParam("~ToPoolAll~", this.PoolName);
            clientBrokerManager.client.SendMessage(query);
        }

        public void SendMessageWithResponse<T>(Query query, Action<T> callback)
        {
            query.AddQueryParam("~ToPool~", this.PoolName);
            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<T>());
            });
        }
        public void SendAllMessageWithResponse<T>(Query query, Action<T> callback)
        {
            query.AddQueryParam("~ToPoolAll~", this.PoolName);
            clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<T>());
            });
        }
    }
    public class BrokerPoolSwimmer
    {
        private BrokerPool brokerPool;
        public string Id { get; set; }

        public BrokerPoolSwimmer(BrokerPool brokerPool, SwimmerResponse a)
        {
            this.brokerPool = brokerPool;
            this.Id = a.Id;
        }


        public void SendMessage(Query query)
        {
            query.AddQueryParam("~ToSwimmer~", this.Id);
            brokerPool.clientBrokerManager.client.SendMessage(query);
        }
        public void SendMessageWithResponse<T>(Query query, Action<T> callback)
        {
            query.AddQueryParam("~ToSwimmer~", this.Id);
            brokerPool.clientBrokerManager.client.SendMessageWithResponse(query, (response) =>
            {
                callback(response.GetJson<T>());
            });
        }
    }

    class Program
    {
        static void Main(string[] args)
        {
            Thread.Sleep(500);
            var threadManager = LocalThreadManager.Start();

            var c = new ClientBrokerManager();
            c.ConnectToBroker("127.0.0.1");
            c.OnDisconnect += () => { };

            c.GetPool("GameServers", pool =>
            {
                pool.OnMessage += (swimmer, message) => { };
             
                pool.JoinPool(() =>
                {
                    pool.GetSwimmers(swimmers =>
                    {
                        foreach (var swimmer in swimmers)
                        {
                            Console.WriteLine(swimmer.Id);
                            swimmer.SendMessage(Query.Build("Foo"));
                            swimmer.SendMessageWithResponse<object>(Query.Build("Bar"), (message) => { });
                        }
                    });
                    pool.SendMessage(Query.Build("CreateGame", new QueryParam("Name", "B")));
                    pool.SendAllMessage(Query.Build("WakeUp"));
                    pool.SendMessageWithResponse<object>(Query.Build("CreateName"), (message) => { });
                    pool.SendAllMessageWithResponse<object>(Query.Build("WakeUp"), (message) => { });
                });
            });


            threadManager.Process();
        }

    }


}
