using System.Threading;

namespace OnPoolCommon
{
    public interface ILocalBackgroundWorker
    {
        Thread Thread { get; set; }
        object TryGetResponse();
        void ProcessResponseMainThread(object response);
    }
}