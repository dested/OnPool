using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace BrokerCommon
{


    public class QueryParam
    {
        public QueryParam(string key, string value)
        {
            Key = key;
            Value = value;
        }

        public string Key { get; set; }
        public string Value { get; set; }
    }
    public class Query
    {
        public Query(string method, QueryParam[] queryParams)
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
        public Dictionary<string, string> QueryParams { get; set; }


        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append(Method);
            sb.Append("?");
            foreach (var query in QueryParams)
            {
                sb.Append(query.Key);
                sb.Append("=");
                sb.Append(query.Value);
                sb.Append("&");
            }
            return sb.ToString();
        }

        public static Query Build(string method, params QueryParam[] queryParams)
        {
            return new Query(method, queryParams);
        }
        public static Query Build(string method, string json)
        {
            return new Query(method, new[] { new QueryParam("Json", json) });
        }
        public static Query Build<T>(string method, T json)
        {
            return new Query(method, new[] { new QueryParam("Json", json.ToJson()) });
        }

        public static Query Parse(string message)
        {
            var messageSplit = message.Split(new[] { '?' }, StringSplitOptions.RemoveEmptyEntries);
            List<QueryParam> qparams = new List<QueryParam>();
            foreach (var s in messageSplit[1].Split(new[] { '&' }, StringSplitOptions.RemoveEmptyEntries))
            {
                var querySplit = s.Split('=');
                qparams.Add(new QueryParam(querySplit[0], querySplit[1]));
            }

            return new Query(messageSplit[0], qparams.ToArray());
        }

        public void AddQueryParam(string key, string value)
        {
            QueryParams.Add(key, value);
        }

        public T GetJson<T>()
        {
            return QueryParams["Json"].FromJson<T>();
        }
    }

}