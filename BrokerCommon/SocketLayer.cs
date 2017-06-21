using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace BrokerCommon
{
    public delegate void OnMessage(Swimmer from, Query message);
    public delegate void OnMessageWithResponse(Swimmer from, Query message, Action<Query> respond);


    public class SocketLayer
    {
        public string Id { get; set; }
        private bool disconnected = false;
        private Socket socket;
        private readonly Func<string, Swimmer> _getSwimmer;

        private LocalBackgroundWorker<object, WorkerResponse> awaitMessagesWorker;
        private string serverIp;

        public Action<SocketLayer> OnDisconnect { get; set; }
        public OnMessage OnMessage { get; set; }
        public OnMessageWithResponse OnMessageWithResponse { get; set; }
        public static int counter = 0;

        public SocketLayer(Socket socket, Func<string, Swimmer> getSwimmer)
        {
            this.socket = socket;
            _getSwimmer = getSwimmer;
            Id = Guid.NewGuid().ToString("N");
            //            Console.WriteLine("Connected Client " + client.Id);
        }


        public SocketLayer(string serverIp, Func<string, Swimmer> getSwimmer)
        {
            this.serverIp = serverIp;
            _getSwimmer = getSwimmer;
        }


        public void StartFromClient()
        {
            socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            socket.Connect(new IPEndPoint(IPAddress.Parse(this.serverIp), 1987));
            this.Start();
        }

        public void Start()
        {
            socket.ReceiveTimeout = 30000;
            socket.SendTimeout = 30000;
            socket.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.KeepAlive, 0);
            awaitMessagesWorker = new LocalBackgroundWorker<object, WorkerResponse>();
            awaitMessagesWorker.DoWork += (worker, _) => Thread_MonitorStream(worker);
            awaitMessagesWorker.ReportResponse += ReceiveResponse;
            awaitMessagesWorker.Run();
        }

        Dictionary<string, int> poolAllCounter = new Dictionary<string, int>();
        private void ReceiveResponse(WorkerResponse response)
        {
            try
            {
                counter++;
                switch (response.Result)
                {
                    case WorkerResult.Message:

                        var query = Query.Parse(response.Payload);

                        Swimmer fromSwimmer;
                        if (query.Contains("~FromSwimmer~"))
                        {
                            fromSwimmer = this._getSwimmer(query["~FromSwimmer~"]);
                        }
                        else
                        {
                            fromSwimmer = this._getSwimmer(Id);
                        }
                    

                        if (query.Contains("~Response~"))
                        {
                            query.Remove("~Response~");
                            if (messageResponses.ContainsKey(query["~ResponseKey~"]))
                            {
                                var callback = messageResponses[query["~ResponseKey~"]];

                                if (query.Contains("~PoolAllCount~"))
                                {
                                    if (!poolAllCounter.ContainsKey(query["~ResponseKey~"]))
                                    {
                                        poolAllCounter[query["~ResponseKey~"]] = 1;
                                    }
                                    else
                                    {
                                        poolAllCounter[query["~ResponseKey~"]] =
                                            poolAllCounter[query["~ResponseKey~"]] + 1;
                                    }

                                    if (poolAllCounter[query["~ResponseKey~"]] == int.Parse(query["~PoolAllCount~"]))
                                    {
                                        messageResponses.Remove(query["~ResponseKey~"]);
                                        poolAllCounter.Remove(query["~ResponseKey~"]);
                                    }
                                }
                                else
                                {
                                    messageResponses.Remove(query["~ResponseKey~"]);
                                }
                                query.Remove("~ResponseKey~");
                                callback(query);
                            }
                            else
                            {
                                throw new Exception("Cannot find response callback");
                            }
                        }
                        else if (query.Contains("~ResponseKey~"))
                        {
                            var receiptId = query["~ResponseKey~"];
                            query.Remove("~ResponseKey~");
                            OnMessageWithResponse?.Invoke(fromSwimmer, query, (queryResponse) =>
                                {
                                    queryResponse.Add("~Response~");
                                    queryResponse.Add("~ResponseKey~", receiptId);
                                    SendMessage(queryResponse);
                                }
                            );
                        }
                        else
                        {
                            OnMessage?.Invoke(fromSwimmer, query);
                        }
                        break;
                    case WorkerResult.Disconnect:
                        Disconnect();
                        break;
                    default:
                        throw new ArgumentOutOfRangeException();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed Receive message:");
                Console.WriteLine($"{response.Result} {response.Payload}");
                Console.WriteLine($"{ex}");
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
//            Console.WriteLine("Disconnecting " + this.Id);
        }

        Dictionary<string, Action<Query>> messageResponses = new Dictionary<string, Action<Query>>();

        public bool SendMessageWithResponse(Query message, Action<Query> callback)
        {
            var responseKey = Guid.NewGuid().ToString("N");
            message.Add("~ResponseKey~", responseKey);
            messageResponses[responseKey] = callback;

            return SendMessage(message);
        }


        public bool SendMessage(Query message)
        {
            if (!socket.Connected)
            {
                Disconnect();
                return false;
            }

            if (this.Id != null && !message.Contains("~FromSwimmer~"))
                message["~FromSwimmer~"] = this.Id;

            byte[] msg = Encoding.ASCII.GetBytes(message + "\0");

            try
            {
                socket.Send(msg);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Send exception: {ex}");
                Disconnect();
                return false;
            }
            return true;
        }


        bool Thread_IsConnected()
        {
            if (socket.Connected)
            {
                if (socket.Poll(1, SelectMode.SelectRead))
                {
                    byte[] buffer = new byte[1];
                    if (socket.Receive(buffer, SocketFlags.Peek) == 0)
                    {
                        return false;
                    }
                    else
                    {
                        return true;
                    }
                }
                else
                {
                    return false;
                }
            }
            else
            {
                return false;
            }
        }
        private void Thread_MonitorStream(LocalBackgroundWorker<object, WorkerResponse> worker)
        {
            try
            {
                int i;
                var bytes = new byte[256];
                var continueBuffer = "";
                top:
                while ((i = socket.Receive(bytes)) != 0)
                {
                    if (i == 0)
                    {
                        if (!Thread_IsConnected())
                        {
                            Thread_Disconnected(worker);
                            return;
                        }
                        continue;
                    }

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
                if (Thread_IsConnected())
                {
                    goto top;
                }
                else
                {
                    Thread_Disconnected(worker);
                }
            }
            catch (IOException ex)
            {
                Thread_Disconnected(worker);
                return;
            }
            catch (SocketException ex)
            {
                Thread_Disconnected(worker);
                return;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Receive Exception: {ex}");
                Thread_Disconnected(worker);
                return;
            }

        }

        private void Thread_Disconnected(LocalBackgroundWorker<object, WorkerResponse> worker)
        {
            worker.SendResponse(WorkerResponse.Disconnect());
        }


        public void ForceDisconnect()
        {
            socket.Close();
            Disconnect();
        }
    }
}
