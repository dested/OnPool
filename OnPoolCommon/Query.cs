using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;

namespace OnPoolCommon
{
    //    [DebuggerStepThrough]
    public class Query
    {
        public string To { get; set; }
        public string From { get; set; }
        public QueryType Type { get; set; }
        public QueryDirection Direction { get; set; }
        public ResponseOptions ResponseOptions { get; set; }
        public string Method { get; set; }
        public string RequestKey { get; set; }
        public string Json { get; set; }
        public int PoolAllCount { get; set; } = -1;

        public Query()
        {
        }

        public Query AddJson<T>(T obj)
        {
            Json = obj.ToJson();
            return this;
        }
        public byte[] GetBytes()
        {
            var sb = new StringBuilder();
            sb.Append(To);
            sb.Append("|");
            sb.Append(From);
            sb.Append("|");
            sb.Append(RequestKey);
            sb.Append("|");
            sb.Append(Method);
            sb.Append("|");
            if (Json != null)
            {
                sb.Append(Json.Replace("|","%`%"));
            }
            sb.Append("|");
            if (PoolAllCount > -1)
            {
                sb.Append(PoolAllCount);
            }

            var bytes = new byte[sb.Length + 3 + 1];
            bytes[0] = (byte)Direction;
            bytes[1] = (byte)Type;
            bytes[2] = (byte)ResponseOptions;
            Encoding.UTF8.GetBytes(sb.ToString(), 0, sb.Length, bytes, 3);
            if (bytes.Length > 1024 * 1024 * 5)
            {
                throw new ArgumentException("The message is longer than 5mb.");
            }
            return bytes;
        }


        public static Query Parse(byte[] continueBuffer)
        {
            try
            {
                var pieces = Encoding.UTF8.GetString(continueBuffer, 3, continueBuffer.Length - 3).Split('|');
                var query = new Query();

                if (!string.IsNullOrWhiteSpace(pieces[0]))
                    query.To = pieces[0];

                if (!string.IsNullOrWhiteSpace(pieces[1]))
                    query.From = pieces[1];

                if (!string.IsNullOrWhiteSpace(pieces[2]))
                    query.RequestKey = pieces[2];

                query.Method = pieces[3];

                if (!string.IsNullOrWhiteSpace(pieces[4]))
                    query.Json = pieces[4].Replace("%`%","|");

                if (!string.IsNullOrWhiteSpace(pieces[5]))
                    query.PoolAllCount = int.Parse(pieces[5]);

                query.Direction = (QueryDirection)continueBuffer[0];
                query.Type = (QueryType)continueBuffer[1];
                query.ResponseOptions = (ResponseOptions)continueBuffer[2];

                return query;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed Receive message:");
                Console.WriteLine($"{Encoding.UTF8.GetString(continueBuffer)}");
                Console.WriteLine($"{ex}");
                return null;
            }
        }


        public override string ToString()
        {
            var sb = new StringBuilder();

            sb.Append(Method);
            sb.Append("?");
            sb.Append(Direction);
            sb.Append("/");
            sb.Append(Type);
            sb.Append("|");
            sb.Append(To);
            sb.Append("|");
            sb.Append(From);
            sb.Append("|");
            sb.Append(RequestKey);
            sb.Append("|");
            sb.Append(ResponseOptions);
            return sb.ToString();
        }


        public T GetJson<T>()
        {
            if (Json != null)
                return Json.FromJson<T>();
            return default(T);
        }

        public static Query BuildServerRequest(string method, ResponseOptions options = ResponseOptions.SingleResponse)
        {
            return new Query()
            {
                Method = method,
                Direction = QueryDirection.Request,
                Type = QueryType.Server,
                ResponseOptions = options
            };
        }

        public static Query BuildServerResponse(string method, ResponseOptions options = ResponseOptions.SingleResponse)
        {
            return new Query()
            {
                Method = method,
                Direction = QueryDirection.Response,
                Type = QueryType.Client,
                ResponseOptions = options
            };
        }
    }


    public enum ResponseOptions
    {
        SingleResponse = 1,
        OpenResponse = 2
    }

    public enum QueryDirection
    {
        Request = 1,
        Response = 2
    }

    public enum QueryType
    {
        Client = 1,
        Pool = 2,
        PoolAll = 3,
        Server = 4
    }
}