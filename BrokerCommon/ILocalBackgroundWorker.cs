using System.Threading;

namespace BrokerCommon
{
    public interface ILocalBackgroundWorker
    {
        Thread Thread { get; set; }
        object TryGetResponse();
        void ProcessResponseMainThread(object response);
    }
}