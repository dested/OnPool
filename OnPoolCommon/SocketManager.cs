//#define DUMP

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;

namespace OnPoolCommon
{
    [DebuggerStepThrough]
    public class SocketManager
    {
        private LocalBackgroundWorker<object, WorkerResponse> awaitMessagesWorker;
        private bool disconnected;
        private readonly string serverIp;
        private Socket socket;

        public static int Counter;
        public Action<SocketManager, Query> onReceive;
        public string Id { get; set; }
        public Action<SocketManager> OnDisconnect { get; set; }

        public SocketManager(Socket socket)
        {
            this.socket = socket;
            Id = Guid.NewGuid().ToString("N");
#if DUMP
            Console.WriteLine("Connected Client " + Id);
#endif
        }

        public SocketManager(string serverIp)
        {
            this.serverIp = serverIp;
        }

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
            try {
                Counter++;
                switch (response.Result) {
                    case WorkerResult.Message:
                        var query = Query.Parse(response.Query);
#if DUMP
                        Console.WriteLine(query);
#endif
                        onReceive(this, query);
                        break;
                    case WorkerResult.Disconnect:
                        Disconnect();
                        break;
                    default:
                        throw new ArgumentOutOfRangeException();
                }
            }
            catch (Exception ex) {
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
            awaitMessagesWorker.Dispose();
            try {
                //                socket.Shutdown(SocketShutdown.Both);
                socket.Close();
            }
            catch (SocketException) {

            }
#if DUMP
            Console.WriteLine("Disconnecting " + this.Id);
#endif
        }

        public bool SendMessage(Query message)
        {
#if DUMP
            Console.WriteLine("Send " + message);
#endif
            if (!socket.Connected) {
                Disconnect();
                return false;
            }

            try {
                socket.Send(message.GetBytes());
            }
            catch (SocketException) {
                Disconnect();
                return false;
            }
            catch (Exception ex) {
                Console.WriteLine($"Send exception: {ex}");
                Disconnect();
                return false;
            }
            return true;
        }


        private bool Thread_IsConnected()
        {
            if (socket.Connected)
                if (socket.Poll(1, SelectMode.SelectRead)) {
                    var buffer = new byte[1];
                    if (socket.Receive(buffer, SocketFlags.Peek) == 0)
                        return false;
                    return true;
                }
                else {
                    return false;
                }
            return false;
        }

        private void Thread_MonitorStream(LocalBackgroundWorker<object, WorkerResponse> worker)
        {
            try {
                int i;
                var bytes = new byte[256];
                byte[] continueBuffer = new byte[1024 * 1024 * 5];
                int bufferIndex = 0;
                while (true) {
                    while ((i = socket.Receive(bytes)) != 0) {
                        for (var j = 0; j < i; j++) {
                            var b = bytes[j];


                            if (b == 0) {
                                var response = WorkerResponse.FromQuery(continueBuffer, bufferIndex);
                                if (response != null)
                                    worker.SendResponse(response);
                                bufferIndex = 0;
                            }
                            else {
                                continueBuffer[bufferIndex++] = b;
                            }
                        }
                    }
                    if (Thread_IsConnected())
                        continue;
                    Thread_Disconnected(worker);
                    break;
                }
            }
            catch (IOException) {
                Thread_Disconnected(worker);
            }
            catch (SocketException) {
                Thread_Disconnected(worker);
            }
            catch (ObjectDisposedException) {
                Thread_Disconnected(worker);
            }
            catch (Exception ex) {
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
            Disconnect();
        }
    }
}