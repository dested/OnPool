using System.Collections.Generic;
using System.Threading.Tasks;

namespace OnPoolCommon
{
    public class LocalThreadManager
    {
        private static LocalThreadManager instance;
        private readonly List<ILocalBackgroundWorker> workers = new List<ILocalBackgroundWorker>();
        private bool alive;

        private LocalThreadManager()
        {
            alive = true;
        }


        public static LocalThreadManager Start()
        {
            return instance = new LocalThreadManager();
        }

        public static LocalThreadManager GetInstance()
        {
            return instance;
        }

        public Task Process()
        {
            return Task.Run(() =>
            {
                while (alive)
                {
                    lock (workers)
                    {
                        var originalCount = workers.Count;
                        for (var index = workers.Count - 1; index >= 0; index--)
                        {
                            
                            var worker = workers[index];
                            var response = worker.TryGetResponse();
                            if (response != null)
                            {
                                worker.ProcessResponseMainThread(response);
                                if (workers.Count != originalCount)
                                {
                                    break;
                                }
                            }
                        }
                    }
                }
            });
        }


        public void AddWorker(ILocalBackgroundWorker worker)
        {
            lock (workers)
            {
                workers.Add(worker);
            }
        }

        public void Kill()
        {
            alive = false;
        }

        public void RemoveWorker(ILocalBackgroundWorker localBackgroundWorker)
        {
            lock (workers)
            {
                workers.Remove(localBackgroundWorker);
            }
        }
    }
}