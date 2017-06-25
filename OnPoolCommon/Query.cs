using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;

namespace OnPoolCommon
{
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
    //    [DebuggerStepThrough]
    public class Query
    {
        public string To { get; set; }
        public string From { get; set; }
        public QueryType Type { get; set; }
        public QueryDirection Direction { get; set; }
        public string Method { get; set; }
        public string RequestKey { get; set; }

        private Query(string method, QueryDirection direction, QueryType type, ResponseOptions responseOptions, params QueryParam[] queryParams)
        {
            ResponseOptions = responseOptions;
            Direction = direction;
            Type = type;
            Method = method;
            QueryParams = queryParams.ToDictionary(a => a.Key, a => a.Value);
        }

        public Query(Query query)
        {
            ResponseOptions = query.ResponseOptions;
            To = query.To;
            From = query.From;
            Method = query.Method;
            Type = query.Type;
            RequestKey = query.RequestKey;
            Direction = query.Direction;
            QueryParams = new Dictionary<string, string>(query.QueryParams);
        }

        private Dictionary<string, string> QueryParams { get; }
        public ResponseOptions ResponseOptions { get; set; }

        public string this[string key]
        {
            get { return QueryParams[key]; }
            set { QueryParams[key] = value; }
        }

        public bool Contains(string key)
        {
            return QueryParams.ContainsKey(key);
        }

        public void Add(string key, string value)
        {
            QueryParams.Add(key, value);
        }

        public void Add(string key)
        {
            QueryParams.Add(key, "");
        }
        public void Add(Query query)
        {
            foreach (var queryQueryParam in query.QueryParams) {
                QueryParams.Add(queryQueryParam.Key, queryQueryParam.Value);
            }
        }

        public void Remove(string key)
        {
            QueryParams.Remove(key);
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

        public static Query Build(string method, QueryDirection direction, QueryType type, params QueryParam[] queryParams)
        {
            return new Query(method, direction, type, ResponseOptions.SingleResponse, queryParams);
        }

        public static Query Build<T>(string method, QueryDirection direction, QueryType type, T json, params QueryParam[] queryParams)
        {
            var qp = new List<QueryParam> { new QueryParam("Json", json.ToJson()) };
            qp.AddRange(queryParams);
            return new Query(method, direction, type, ResponseOptions.SingleResponse, qp.ToArray());
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
                var query = new Query(messageSplit[0], direction, type, responseOptions, qparams.ToArray());
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
                return QueryParams["Json"].FromJson<T>();
            return default(T);
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

        public static QueryParam Json<T>(T t)
        {
            return new QueryParam("Json", t.ToJson());
        }
    }
    public enum ResponseOptions
    {
        SingleResponse = 1,
        OpenResponse = 2
    }
}