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
        public Query Query { get; set; }

        public static WorkerResponse Disconnect()
        {
            return new WorkerResponse {Result = WorkerResult.Disconnect};
        }

        public static WorkerResponse FromQuery(byte[] continueBuffer, byte[] bytes, int start, int len)
        {
            var index = 0;
            var sb = new StringBuilder();

            if (continueBuffer != null)
                for (int i = 0, l = continueBuffer.Length; i < l; i++)
                    sb.Append(Convert.ToChar(continueBuffer[i]));

            for (var i = start; i < start + len; i++)
                sb.Append(Convert.ToChar(bytes[i]));


            var query = Query.Parse(sb.ToString());
            if (query == null)
                return null;
            return new WorkerResponse {Result = WorkerResult.Message, Query = query};
        }
    }

    internal enum WorkerResult
    {
        Message,
        Disconnect
    }
}