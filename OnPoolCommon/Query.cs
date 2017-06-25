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
        private List<QueryParam> QueryParams { get; set; }

        public Query()
        {
            QueryParams = new List<QueryParam>();
        }

        public bool Contains(string key)
        {
            return QueryParams.Any(a => a.Key == key);
        }
        public string Get(string key)
        {
            return QueryParams.FirstOrDefault(a => a.Key == key)?.Value;
        }

        public Query Add(string key, string value = "")
        {
            QueryParams.Add(new QueryParam(key, value));
            return this;
        }
        public Query AddJson<T>(T obj)
        {
            QueryParams.Add(new QueryParam("Json", obj.ToJson()));
            return this;
        }

        public void Remove(string key)
        {
            QueryParams.RemoveAll(a => a.Key == key);
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
            sb.Append("?");
            foreach (var query in QueryParams) {
                sb.Append(query.Key);
                sb.Append("=");
                sb.Append(Uri.EscapeDataString(query.Value));
                sb.Append("&");
            }

            var bytes = new byte[sb.Length + 3 + 1];
            bytes[0] = (byte)Direction;
            bytes[1] = (byte)Type;
            bytes[2] = (byte)ResponseOptions;
            Encoding.UTF8.GetBytes(sb + "\0", 0, sb.Length + 1, bytes, 3);
            return bytes;
        }


        public static Query Parse(byte[] continueBuffer)
        {
            try {
                QueryDirection direction = (QueryDirection)continueBuffer[0];
                QueryType type = (QueryType)continueBuffer[1];
                ResponseOptions responseOptions = (ResponseOptions)continueBuffer[2];

                var pieces = Encoding.UTF8.GetString(continueBuffer, 3, continueBuffer.Length - 3).Split('|');
                var messageSplit = pieces[3].Split(new[] { '?' }, StringSplitOptions.RemoveEmptyEntries);

                var qparams = new List<QueryParam>();
                if (messageSplit.Length == 2) {
                    var split = messageSplit[1].Split(new[] { '&' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var s in split) {
                        var querySplit = s.Split('=');
                        qparams.Add(new QueryParam(querySplit[0], Uri.UnescapeDataString(querySplit[1])));
                    }
                }
                var query = new Query();
                query.Direction = direction;
                query.Method = messageSplit[0];
                query.Type = type;
                query.ResponseOptions = responseOptions;
                query.QueryParams = qparams;
                if (!string.IsNullOrWhiteSpace(pieces[0]))
                    query.To = pieces[0];
                if (!string.IsNullOrWhiteSpace(pieces[1]))
                    query.From = pieces[1];
                if (!string.IsNullOrWhiteSpace(pieces[2]))
                    query.RequestKey = pieces[2];

                return query;
            }
            catch (Exception ex) {
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
            foreach (var query in QueryParams) {
                sb.Append(query.Key);
                sb.Append("=");
                sb.Append(Uri.EscapeDataString(query.Value));
                sb.Append("&");
            }

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
            if (Contains("Json"))
                return Get("Json").FromJson<T>();
            return default(T);
        }

        public static Query BuildServerRequest(string method, ResponseOptions options = ResponseOptions.SingleResponse)
        {
            return new Query() {
                Method = method,
                Direction = QueryDirection.Request,
                Type = QueryType.Server,
                ResponseOptions = options
            };

        }
        public static Query BuildServerResponse(string method, ResponseOptions options = ResponseOptions.SingleResponse)
        {
            return new Query() {
                Method = method,
                Direction = QueryDirection.Response,
                Type = QueryType.Client,
                ResponseOptions = options
            };

        }
    }

    [DebuggerStepThrough]
    public class QueryParam
    {
        public QueryParam(string key, object value)
        {
            Key = key;
            Value = value.ToString();
        }

        public string Key { get; set; }
        public string Value { get; set; }
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