using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;

namespace OnPoolCommon
{
    [DebuggerStepThrough]
    public class Query
    {
        private Query(string method, params QueryParam[] queryParams)
        {
            Method = method;
            QueryParams = queryParams.ToDictionary(a => a.Key, a => a.Value);
        }

        public Query(Query query)
        {
            Method = query.Method;
            QueryParams = new Dictionary<string, string>(query.QueryParams);
        }

        public string Method { get; set; }
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

        public void Remove(string key)
        {
            QueryParams.Remove(key);
        }

        public byte[] GetBytes()
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

            return Encoding.ASCII.GetBytes(sb + "\0");
        }

        public static Query Build(string method, params QueryParam[] queryParams)
        {
            return new Query(method, queryParams);
        }

        public static Query Build<T>(string method, T json, params QueryParam[] queryParams)
        {
            var qp = new List<QueryParam> {new QueryParam("Json", json.ToJson())};
            qp.AddRange(queryParams);
            return new Query(method, qp.ToArray());
        }


        public static Query Parse(string message)
        {
            try
            {
                var messageSplit = message.Split(new[] {'?'}, StringSplitOptions.RemoveEmptyEntries);

                var qparams = new List<QueryParam>();
                if (messageSplit.Length == 2)
                {
                    var split = messageSplit[1].Split(new[] {'&'}, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var s in split)
                    {
                        var querySplit = s.Split('=');
                        qparams.Add(new QueryParam(querySplit[0], Uri.UnescapeDataString(querySplit[1])));
                    }
                }
                return new Query(messageSplit[0], qparams.ToArray());
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed Receive message:");
                Console.WriteLine($"{message}");
                Console.WriteLine($"{ex}");
                return null;
            }
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
            return new QueryParam("Json",t.ToJson());
        }
    }
}