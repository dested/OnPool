using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Threading;

namespace OnPoolCommon
{
    public class LocalBackgroundWorker<TPayload, TResponse> :IDisposable, ILocalBackgroundWorker where TPayload : class
    {
        private readonly BackgroundWorker bw;
        private bool noResponses = true;

        private readonly List<TResponse> responses = new List<TResponse>();

        public LocalBackgroundWorker()
        {
            if (UserLocalWorker)
                LocalThreadManager.GetInstance().AddWorker(this);
            else
                bw = new BackgroundWorker();
        }

        private bool UserLocalWorker => LocalThreadManager.GetInstance() != null;

        public Action<LocalBackgroundWorker<TPayload, TResponse>, TPayload> DoWork { get; set; }
        public Action<TResponse> ReportResponse { get; set; }
        public Thread Thread { get; set; }

        public object TryGetResponse()
        {
            if (noResponses)
                return null;
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
            ReportResponse((TResponse) response);
        }

        public void Run(TPayload payload)
        {
            if (UserLocalWorker)
            {
                Thread = new Thread(() => {
                    DoWork(this, payload);
                });
                Thread.Start();
            }
            else
            {
                bw.WorkerReportsProgress = true;
                bw.DoWork += (_, __) => { DoWork(this, payload); };
                bw.ProgressChanged += (_, __) => { ReportResponse((TResponse) __.UserState); };
                bw.RunWorkerAsync(payload);
            }
        }

        public void Run()
        {
            Run(null);
        }

        public void SendResponse(TResponse response)
        {
            if (UserLocalWorker)
                lock (responses)
                {
                    responses.Add(response);
                    noResponses = false;
                }
            else
                bw.ReportProgress(0, response);
        }

        public void Dispose()
        {
            if (UserLocalWorker)
            {
                LocalThreadManager.GetInstance().RemoveWorker(this);
            }
            else
            {
                bw.Dispose();
            }
        }
    }
}