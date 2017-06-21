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
                    for (var index = workers.Count - 1; index >= 0; index--)
                    {
                        var worker = workers[index];
                        var response = worker.TryGetResponse();
                        if (response != null)
                            worker.ProcessResponseMainThread(response);
                    }
            });
        }


        public void AddWorker(ILocalBackgroundWorker worker)
        {
            workers.Add(worker);
        }

        public void Kill()
        {
            alive = false;
        }
    }
}