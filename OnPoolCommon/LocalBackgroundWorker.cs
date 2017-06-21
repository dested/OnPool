using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Threading;

namespace OnPoolCommon
{
    public class LocalBackgroundWorker<TPayload, TResponse> : ILocalBackgroundWorker where TPayload : class
    {

        private bool UserLocalWorker => LocalThreadManager.GetInstance() != null;
        public Thread Thread { get; set; }
        private BackgroundWorker bw;

        public LocalBackgroundWorker()
        {
            if (UserLocalWorker)
            {
                LocalThreadManager.GetInstance().AddWorker(this);
            
            }
            else
            {
                bw = new BackgroundWorker();
            }
        }

        public Action<LocalBackgroundWorker<TPayload, TResponse>, TPayload> DoWork { get; set; }
        public Action<TResponse> ReportResponse { get; set; }

        public void Run(TPayload payload)
        {
            if (UserLocalWorker)
            {
                Thread = new Thread(() =>
                {
                    this.DoWork(this, payload);
                });
                Thread.Start();
            }
            else
            {
                bw.WorkerReportsProgress = true;
                bw.DoWork += (_, __) =>
                {
                    this.DoWork(this, payload);
                };
                bw.ProgressChanged += (_, __) =>
                {
                    this.ReportResponse((TResponse) __.UserState);
                };
                bw.RunWorkerAsync(payload);
            }
        }
        public void Run()
        {
            Run(null);
        }

        private List<TResponse> responses = new List<TResponse>();
        private bool noResponses = true;
        public void SendResponse(TResponse response)
        {
            if (UserLocalWorker)
            {

                lock (responses)
                {
                    responses.Add(response);
                    noResponses = false;
                }
            }
            else
            {
                bw.ReportProgress(0, response);
            }
        }
        public object TryGetResponse()
        {
            if (noResponses)
            {
                return null;
            }
            lock (responses)
            {
                var response = responses[0];
                responses.RemoveAt(0);
                noResponses = responses.Count == 0;
                return response;
            }
        }

        public void ProcessResponseMainThread(object response)
        {
            this.ReportResponse((TResponse)response);
        }
    }

}
