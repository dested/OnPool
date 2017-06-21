using System.Collections.Generic;
using System.Threading.Tasks;

namespace BrokerCommon
{
    public class LocalThreadManager
    {
        private static LocalThreadManager _instance;
        private bool alive { get; set; }

        private LocalThreadManager()
        {
            alive = true;
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

        public Task Process()
        {
            return Task.Run(() =>
            {
                while (alive)
                {

                    for (var index = workers.Count - 1; index >= 0; index--)
                    {
                        var worker = workers[index];
                        object response = worker.TryGetResponse();
                        if (response != null)
                        {
                            worker.ProcessResponseMainThread(response);
                        }
                    }

                }
            });
        }


        public void AddWorker(ILocalBackgroundWorker worker)
        {
            this.workers.Add(worker);
        }

        public void Kill()
        {
            this.alive = false;
        }
    }
}