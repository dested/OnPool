using System;
using System.Text;

namespace OnPoolCommon
{
    internal class WorkerResponse
    {
        private WorkerResponse()
        {
        }

        public WorkerResult Result { get; set; }
        public byte[] Query { get; set; }

        public static WorkerResponse Disconnect()
        {
            return new WorkerResponse { Result = WorkerResult.Disconnect };
        }

        public static WorkerResponse FromQuery(byte[] continueBuffer, int len)
        {
            var bytes = new byte[len];
            Buffer.BlockCopy(continueBuffer, 0, bytes, 0, len);
         
            return new WorkerResponse { Result = WorkerResult.Message, Query = bytes };
        }
    }

    internal enum WorkerResult
    {
        Message,
        Disconnect
    }
}