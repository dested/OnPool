using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace BrokerCommon
{
    public class LocalThreadManager
    {
        private static LocalThreadManager _instance;

        private LocalThreadManager()
        {
        }

        public static LocalThreadManager Start()
        {
            return _instance = new LocalThreadManager();
        }
        private List<ILocalBackgroundWorker> workers = new List<ILocalBackgroundWorker>();

        public static LocalThreadManager GetInstance()
        {
            return _instance;
        }

        public void Process()
        {
            while (true)
            {

                var tempWorkers = workers.ToArray();
                foreach (var worker in tempWorkers)
                {
                    object response;
                    while ((response = worker.TryGetResponse()) != null)
                    {
                        worker.ProcessResponseMainThread(response);
                    }
                }

            }
        }

        public void AddWorker(ILocalBackgroundWorker worker)
        {
            this.workers.Add(worker);
        }
    }

    public interface ILocalBackgroundWorker
    {
        Thread Thread { get; set; }
        object TryGetResponse();
        void ProcessResponseMainThread(object response);
    }


    public class LocalBackgroundWorker<TPayload, TResponse> : ILocalBackgroundWorker where TPayload : class
    {

        public Thread Thread { get; set; }

        public LocalBackgroundWorker()
        {
            LocalThreadManager.GetInstance().AddWorker(this);
        }

        public Action<LocalBackgroundWorker<TPayload, TResponse>, TPayload> DoWork { get; set; }
        public Action<LocalBackgroundWorker<TPayload, TResponse>, TResponse> ProgressChanged { get; set; }

        public void Run(TPayload payload)
        {
            Thread = new Thread(() =>
            {
                this.DoWork(this, payload);
            });
            Thread.Start();
        }
        public void Run()
        {
            Run(null);
        }

        private List<TResponse> responses = new List<TResponse>();

        public void SendResponse(TResponse response)
        {
            lock (responses)
            {
                responses.Add(response);
            }
        }

        public object TryGetResponse()
        {
            lock (responses)
            {
                if (responses.Count == 0)
                {
                    return null;
                }

                var response = responses[0];
                responses.RemoveAt(0);
                return response;
            }
        }

        public void ProcessResponseMainThread(object response)
        {
            this.ProgressChanged(this, (TResponse)response);
        }
    }

}
