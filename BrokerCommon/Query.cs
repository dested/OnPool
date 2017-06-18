using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;

namespace BrokerCommon
{
    [DebuggerStepThrough]
    public class Query
    {
        private Query(string method, params QueryParam[] queryParams)
        {
            this.Method = method;
            QueryParams = queryParams.ToDictionary(a => a.Key, a => a.Value);
        }

        public Query(Query query)
        {
            this.Method = query.Method;
            this.QueryParams = new Dictionary<string, string>(query.QueryParams);
        }

        public string Method { get; set; }
        private Dictionary<string, string> QueryParams { get; set; }

        public string this[string key]
        {
            get { return QueryParams[key]; }
            set { QueryParams[key] = value; }
        }

        public bool Contains(string key) { return QueryParams.ContainsKey(key); }
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
            this.QueryParams.Remove(key);
        }
        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append(Method);
            sb.Append("?");
            foreach (var query in QueryParams)
            {
                sb.Append(query.Key);
                sb.Append("=");
                sb.Append(Uri.EscapeDataString(query.Value));
                sb.Append("&");
            }
            return sb.ToString();
        }

        public static Query Build(string method, params QueryParam[] queryParams)
        {
            return new Query(method, queryParams);
        }
        public static Query Build<T>(string method, T json, params QueryParam[] queryParams)
        {
            var qp = new List<QueryParam>() { new QueryParam("Json", json.ToJson()) };
            qp.AddRange(queryParams);
            return new Query(method, qp.ToArray());
        }


        public static Query Parse(string message)
        {
            var messageSplit = message.Split(new[] { '?' }, StringSplitOptions.RemoveEmptyEntries);
            List<QueryParam> qparams = new List<QueryParam>();
            if (messageSplit.Length == 2)
            {
                foreach (var s in messageSplit[1].Split(new[] { '&' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    var querySplit = s.Split('=');
                    qparams.Add(new QueryParam(querySplit[0], Uri.UnescapeDataString(querySplit[1])));
                }
            }
            return new Query(messageSplit[0], qparams.ToArray());
        }

        public Query Respond(params QueryParam[] queryParams)
        {
            return new Query(Method, queryParams);
        }
        public Query Respond<T>(T json, params QueryParam[] queryParams)
        {
            var qp = new List<QueryParam>() { new QueryParam("Json", json.ToJson()) };
            qp.AddRange(queryParams);
            return new Query(Method, qp.ToArray());
        }


        public T GetJson<T>()
        {
            if (Contains("Json"))
            {
                return QueryParams["Json"].FromJson<T>();
            }
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
    }

}