using System.Diagnostics;

namespace BrokerCommon
{ 
    [DebuggerStepThrough]
    internal class WorkerResponse
    {
        public WorkerResult Result { get; set; }
        public string Payload { get; set; }
        private WorkerResponse()
        {

        }

        public static WorkerResponse Message(string data)
        {
            return new WorkerResponse() { Result = WorkerResult.Message, Payload = data };
        }
        public static WorkerResponse Disconnect()
        {
            return new WorkerResponse() { Result = WorkerResult.Disconnect };
        }
    }
}