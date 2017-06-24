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
            return new WorkerResponse { Result = WorkerResult.Disconnect };
        }

        public static WorkerResponse FromQuery(byte[] continueBuffer, byte[] bytes, int start, int len)
        {
            var index = 0;
            var sb = new StringBuilder();

            var totalLen = len;

            byte b1 = 0, b2 = 0, b3 = 0;
            if (continueBuffer != null)
            {
                totalLen += continueBuffer.Length;
                for (int i = 0, l = continueBuffer.Length; i < l; i++)
                {
                    if (b1 == 0) b1 = continueBuffer[i];
                    else if (b2 == 0) b2 = continueBuffer[i];
                    else if (b3 == 0) b3 = continueBuffer[i];
                    else sb.Append(Convert.ToChar(continueBuffer[i]));
                }
            }


            for (var i = start; i < start + len; i++)
                if (b1 == 0) b1 = bytes[i];
                else if (b2 == 0) b2 = bytes[i];
                else if (b3 == 0) b3 = bytes[i];
                else sb.Append(Convert.ToChar(bytes[i]));


            var query = Query.Parse(b1, b2, b3, sb.ToString());
            if (query == null)
                return null;
            return new WorkerResponse { Result = WorkerResult.Message, Query = query };
        }
    }

    internal enum WorkerResult
    {
        Message,
        Disconnect
    }
}