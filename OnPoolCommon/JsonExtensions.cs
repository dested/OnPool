using System.Diagnostics;
using Newtonsoft.Json;

namespace OnPoolCommon
{
    [DebuggerStepThrough]
    public static class JsonExtensions
    {
        private static JsonSerializerSettings jsonSerializerSettings;

        public static void SetSerializerSettings(JsonSerializerSettings settings)
        {
            jsonSerializerSettings = settings;
        }
        public static T FromJson<T>(this string json)
        {
            return JsonConvert.DeserializeObject<T>(json, jsonSerializerSettings);
        }

        public static string ToJson<T>(this T obj)
        {
            return JsonConvert.SerializeObject(obj, jsonSerializerSettings);
        }
    }
}