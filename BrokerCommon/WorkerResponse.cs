using System;
using System.Diagnostics;
using System.Text;

namespace BrokerCommon
{
    internal class WorkerResponse
    {
        public WorkerResult Result { get; set; }
        public Query Query { get; set; }
        private WorkerResponse()
        {

        }

        public static WorkerResponse Disconnect()
        {
            return new WorkerResponse() { Result = WorkerResult.Disconnect };
        }

        public static WorkerResponse FromQuery(byte[] continueBuffer, byte[] bytes, int start, int len)
        {

            int index = 0;
            StringBuilder sb = new StringBuilder();

            if (continueBuffer != null)
            {
                for (int i = 0, l = continueBuffer.Length; i < l; i++)
                {
                    sb.Append(Convert.ToChar(continueBuffer[i]));
                }
            }

            for (int i = start; i < start+len; i++)
            {
                sb.Append(Convert.ToChar(bytes[i]));
            }


            var query = Query.Parse(sb.ToString());
            if (query == null)
            {
                return null;
            }
            return new WorkerResponse() { Result = WorkerResult.Message, Query = query };

        }
    }
}