using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;

namespace OnPoolCommon
{
    [DebuggerStepThrough]
    public class SocketManager
    {
        public static int Counter;
        private readonly Action<SocketManager, Query> onReceive;

        private LocalBackgroundWorker<object, WorkerResponse> awaitMessagesWorker;
        private bool disconnected;
        private readonly string serverIp;
        private Socket socket;

        public SocketManager(Socket socket, Action<SocketManager, Query> onReceive)
        {
            this.socket = socket;
            this.onReceive = onReceive;
            Id = Guid.NewGuid().ToString("N");
            //            Console.WriteLine("Connected Client " + client.Id);
        }


        public SocketManager(string serverIp, Action<SocketManager, Query> onReceive)
        {
            this.serverIp = serverIp;
            this.onReceive = onReceive;
        }

        public string Id { get; set; }

        public Action<SocketManager> OnDisconnect { get; set; }


        public void StartFromClient()
        {
            socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            socket.Connect(new IPEndPoint(IPAddress.Parse(serverIp), 1987));
            Start();
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

        private void ReceiveResponse(WorkerResponse response)
        {
            try
            {
                Counter++;
                switch (response.Result)
                {
                    case WorkerResult.Message:
                        onReceive(this, response.Query);
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
                Console.WriteLine("Failed Process message:");
                Console.WriteLine($"{ex}");
            }
        }


        private void Disconnect()
        {
            if (disconnected)
                return;
            disconnected = true;
            OnDisconnect?.Invoke(this);
            //            Console.WriteLine("Disconnecting " + this.Id);
        }


        public bool SendMessage(Query message)
        {
//            Console.WriteLine("Send "+message);

            if (!socket.Connected)
            {
                Disconnect();
                return false;
            }


            try
            {
                socket.Send(message.GetBytes());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Send exception: {ex}");
                Disconnect();
                return false;
            }
            return true;
        }


        private bool Thread_IsConnected()
        {
            if (socket.Connected)
                if (socket.Poll(1, SelectMode.SelectRead))
                {
                    var buffer = new byte[1];
                    if (socket.Receive(buffer, SocketFlags.Peek) == 0)
                        return false;
                    return true;
                }
                else
                {
                    return false;
                }
            return false;
        }

        private void Thread_MonitorStream(LocalBackgroundWorker<object, WorkerResponse> worker)
        {
            try
            {
                int i;
                var bytes = new byte[256];
                byte[] continueBuffer = null;
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

                    var lastZero = 0;
                    for (var j = 0; j < i; j++)
                    {
                        var b = bytes[j];
                        if (b == 0)
                        {
                            var response = WorkerResponse.FromQuery(continueBuffer, bytes, lastZero, j - lastZero);
                            lastZero = j + 1;
                            if (response != null)
                                worker.SendResponse(response);
                            continueBuffer = null;
                        }
                    }
                    if (lastZero != i)
                    {
                        continueBuffer = new byte[i - lastZero];
                        Array.ConstrainedCopy(bytes, lastZero, continueBuffer, 0, i - lastZero);
                    }
                }
                if (Thread_IsConnected())
                    goto top;
                Thread_Disconnected(worker);
            }
            catch (IOException ex)
            {
                Thread_Disconnected(worker);
            }
            catch (SocketException ex)
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


        public void ForceDisconnect()
        {
            socket.Close();
            Disconnect();
        }
    }
}