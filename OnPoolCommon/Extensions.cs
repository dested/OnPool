using System.Diagnostics;
using Newtonsoft.Json;

namespace OnPoolCommon
{
    [DebuggerStepThrough]
    public static class Extensions
    {
        public static T FromJson<T>(this string json)
        {
            return JsonConvert.DeserializeObject<T>(json);
        }
        public static string ToJson<T>(this T obj)
        {
            return JsonConvert.SerializeObject(obj);
        }

    }
}