using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace BrokerCommon
{
    public class ClientConnection
    {
        public string Id { get; set; }
        private bool disconnected = false;
        private TcpClient tcpClient;
        private NetworkStream stream;
        private LocalBackgroundWorker<object, WorkerResponse> awaitMessagesWorker;
        private string serverIp;

        public Action<ClientConnection> OnDisconnect { get; set; }
        public Action<ClientConnection, Query> OnMessage { get; set; }
        public Action<ClientConnection, Query, Action<Query>> OnMessageWithResponse { get; set; }

        public ClientConnection(TcpClient tcpClient)
        {
            this.tcpClient = tcpClient;
            Id = Guid.NewGuid().ToString("N");
        }


        public ClientConnection(string serverIp)
        {
            this.serverIp = serverIp;
            Id = Guid.NewGuid().ToString("N");
        }


        public void StartFromClient()
        {
            tcpClient = new TcpClient(this.serverIp, 1987);

            this.Start();
        }

        public void Start()
        {
            stream = tcpClient.GetStream();
            tcpClient.ReceiveTimeout = 30000;
            tcpClient.SendTimeout = 30000;
            stream = tcpClient.GetStream();
            awaitMessagesWorker = new LocalBackgroundWorker<object, WorkerResponse>();
            awaitMessagesWorker.DoWork += (worker, _) => Thread_MonitorStream(worker);
            awaitMessagesWorker.ReportResponse += (worker, response) => ReceiveResponse(response);
            awaitMessagesWorker.Run();
        }


        private void ReceiveResponse(WorkerResponse response)
        {
            switch (response.Result)
            {
                case WorkerResult.Message:

                    var query = Query.Parse(response.Payload);

                    if (query.Method.EndsWith("~Response~"))
                    {
                        if (messageResponses.ContainsKey(query.QueryParams["~ResponseKey~"]))
                        {
                            var callback = messageResponses[query.QueryParams["~ResponseKey~"]];
                            messageResponses.Remove(query.QueryParams["~ResponseKey~"]);

                            callback(query);
                        }
                        else
                        {
                            throw new Exception("Cannot find response callback");
                        }
                    }
                    else if (query.QueryParams.ContainsKey("~ResponseKey~"))
                    {
                        var receiptId = query.QueryParams["~ResponseKey~"];

                        OnMessageWithResponse?.Invoke(this, query, (queryResponse) =>
                            {
                                queryResponse.AddQueryParam("~ResponseKey~", receiptId);
                                SendMessage(queryResponse);
                            }
                        );
                    }
                    else
                    {
                        OnMessage?.Invoke(this, query);
                    }
                    break;
                case WorkerResult.Disconnect:
                    Disconnect();
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }

        }

        private void Disconnect()
        {
            if (disconnected)
            {
                return;
            }
            disconnected = true;
            OnDisconnect?.Invoke(this);
        }

        Dictionary<string, Action<Query>> messageResponses = new Dictionary<string, Action<Query>>();
        public bool SendMessageWithResponse(Query message, Action<Query> callback)
        {
            var responseKey = Guid.NewGuid().ToString("N");
            message.QueryParams.Add("~ResponseKey~", responseKey);
            messageResponses[responseKey] = callback;

            return SendMessage(message);
        }


        public bool SendMessage(Query message)
        {
            if (!tcpClient.Connected)
            {
                Disconnect();
                return false;
            }

            byte[] msg = Encoding.ASCII.GetBytes(message + "\0");

            try
            {
                stream.Write(msg, 0, msg.Length);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Send exception: {ex}");
                Disconnect();
                return false;
            }
            return true;
        }



        private void Thread_MonitorStream(LocalBackgroundWorker<object, WorkerResponse> worker)
        {
            try
            {
                int i;
                var bytes = new byte[256];
                var continueBuffer = "";
                while ((i = stream.Read(bytes, 0, bytes.Length)) != 0)
                {
                    if (i == 0)
                    {
                        Thread_Disconnected(worker);
                        return;
                    }

                    //todo optimize 
                    int lastZero = 0;
                    for (int j = 0; j < i; j++)
                    {
                        var b = bytes[j];
                        if (b == 0)
                        {
                            string data = Encoding.ASCII.GetString(bytes, lastZero, j - lastZero);
                            lastZero = j + 1;
                            worker.SendResponse(WorkerResponse.Message(continueBuffer + data));
                            continueBuffer = "";
                        }
                    }
                    if (lastZero != i)
                    {
                        string data = Encoding.ASCII.GetString(bytes, lastZero, i - lastZero);
                        continueBuffer += data;
                    }


                }

            }
            catch (IOException ex)
            {
                Thread_Disconnected(worker);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Receive Exception: {ex}");
                Thread_Disconnected(worker);
            }
        }

        private void Thread_Disconnected(LocalBackgroundWorker<object, WorkerResponse> worker)
        {
            worker.SendResponse(WorkerResponse.Disconnect());
        }


    }

    internal class WorkerResponse
    {
        public WorkerResult Result { get; set; }
        public string Payload { get; set; }
        private WorkerResponse()
        {

        }

        public static WorkerResponse Message(string data)
        {
            return new WorkerResponse() { Result = WorkerResult.Message, Payload = data };
        }
        public static WorkerResponse Disconnect()
        {
            return new WorkerResponse() { Result = WorkerResult.Disconnect };
        }
    }

    internal enum WorkerResult
    {
        Message,
        Disconnect
    }
}
