using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace BrokerCommon
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
        public Action<LocalBackgroundWorker<TPayload, TResponse>, TResponse> ReportResponse { get; set; }

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
                    this.ReportResponse(this, (TResponse) __.UserState);
                };
                bw.RunWorkerAsync(payload);
            }
        }
        public void Run()
        {
            Run(null);
        }

        private List<TResponse> responses = new List<TResponse>();

        public void SendResponse(TResponse response)
        {
            if (UserLocalWorker)
            {

                lock (responses)
                {
                    responses.Add(response);
                }
            }
            else
            {
                bw.ReportProgress(0, response);
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
            this.ReportResponse(this, (TResponse)response);
        }
    }

}
