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

        private Query(string method, QueryDirection direction, QueryType type, params QueryParam[] queryParams)
        {
            Direction = direction;
            Type = type;
            Method = method;
            QueryParams = queryParams.ToDictionary(a => a.Key, a => a.Value);
        }

        public Query(Query query)
        {
            To = query.To;
            From = query.From;
            Method = query.Method;
            Type = query.Type;
            RequestKey = query.RequestKey;
            Direction = query.Direction;
            QueryParams = new Dictionary<string, string>(query.QueryParams);
        }

        private Dictionary<string, string> QueryParams { get; }

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
            foreach (var queryQueryParam in query.QueryParams)
            {
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
            foreach (var query in QueryParams)
            {
                sb.Append(query.Key);
                sb.Append("=");
                sb.Append(Uri.EscapeDataString(query.Value));
                sb.Append("&");
            }

            var bytes = new byte[sb.Length + 1 + 2];
            bytes[0] = (byte)Direction;
            bytes[1] = (byte)Type;
            Encoding.ASCII.GetBytes(sb + "\0", 0, sb.Length + 1, bytes, 2);
            return bytes;
        }

        public static Query Build(string method, QueryDirection direction, QueryType type, params QueryParam[] queryParams)
        {
            return new Query(method, direction, type, queryParams);
        }

        public static Query Build<T>(string method, QueryDirection direction, QueryType type, T json, params QueryParam[] queryParams)
        {
            var qp = new List<QueryParam> { new QueryParam("Json", json.ToJson()) };
            qp.AddRange(queryParams);
            return new Query(method, direction, type, qp.ToArray());
        }


        public static Query Parse(byte b1, byte b2, string message)
        {
            try
            {
                QueryDirection direction = (QueryDirection)b1;
                QueryType type = (QueryType)b2;

                var pieces = message.Split('|');


                var messageSplit = pieces[3].Split(new[] { '?' }, StringSplitOptions.RemoveEmptyEntries);

                var qparams = new List<QueryParam>();
                if (messageSplit.Length == 2)
                {
                    var split = messageSplit[1].Split(new[] { '&' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var s in split)
                    {
                        var querySplit = s.Split('=');
                        qparams.Add(new QueryParam(querySplit[0], Uri.UnescapeDataString(querySplit[1])));
                    }
                }
                var query = new Query(messageSplit[0], direction, type, qparams.ToArray());
                if (!string.IsNullOrWhiteSpace(pieces[0]))
                    query.To = pieces[0];
                if (!string.IsNullOrWhiteSpace(pieces[1]))
                    query.From = pieces[1];
                if (!string.IsNullOrWhiteSpace(pieces[2]))
                    query.RequestKey = pieces[2];
                return query;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed Receive message:");
                Console.WriteLine($"{message}");
                Console.WriteLine($"{ex}");
                return null;
            }
        }


        public override string ToString()
        {
            var sb = new StringBuilder();
        
            sb.Append(Method);
            sb.Append("?");
            foreach (var query in QueryParams)
            {
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
}