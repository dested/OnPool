using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;

namespace OnPoolCommon
{
    //    [DebuggerStepThrough]
    public class Message
    {
        public long ToClient { get; set; } = -1;
        public string ToPool { get; set; }
        public long From { get; set; } = -1;
        public MessageType Type { get; set; }
        public MessageDirection Direction { get; set; }
        public ResponseOptions ResponseOptions { get; set; }
        public string Method { get; set; }
        public long RequestKey { get; set; }
        public string Json { get; set; }
        public int PoolAllCount { get; set; } = -1;

        public Message()
        {
        }

        public Message AddJson<T>(T obj)
        {
            Json = obj.ToJson();
            return this;
        }

        public byte[] GetBytes()
        {

            const int lengthOfPayload = 4, enums = 4, from = 8, toClient = 8, toPoolLen = 4, methodLen = 4, jsonLen = 4, requestKey = 8, poolAllCount = 4;

            var byteLen = 0;
            byteLen += lengthOfPayload;
            byteLen += enums;
            byteLen += from;
            switch (Type)
            {
                case MessageType.Client:
                    byteLen += toClient;
                    break;
                case MessageType.Pool:
                case MessageType.PoolAll:
                    byteLen += toPoolLen;
                    if (ToPool != null)
                        byteLen += ToPool.Length;
                    break;
            }
            byteLen += methodLen;
            byteLen += Method.Length;

            byteLen += jsonLen;
            if (Json != null)
            {
                byteLen += Json.Length;
            }

            byteLen += requestKey;
            byteLen += poolAllCount;


            var bytes = new byte[byteLen];

            int cur = 0;
            WriteBytes(byteLen, bytes, cur);
            cur += 4;
            bytes[cur++] = (byte)Direction;
            bytes[cur++] = (byte)Type;
            bytes[cur++] = (byte)ResponseOptions;
            WriteBytes(From, bytes, cur);
            cur += 8;
            switch (Type)
            {
                case MessageType.Client:
                    WriteBytes(ToClient, bytes, cur);
                    cur += 8;
                    break;
                case MessageType.Pool:
                case MessageType.PoolAll:
                    if (ToPool != null)
                    {
                        WriteBytes(ToPool.Length, bytes, cur);
                    }
                    cur += 4;
                    if (ToPool != null)
                    {
                        Encoding.UTF8.GetBytes(ToPool, 0, ToPool.Length, bytes, cur);
                        cur += ToPool.Length;
                    }
                    break;
            }

            WriteBytes(Method.Length, bytes, cur);
            cur += 4;
            Encoding.UTF8.GetBytes(Method, 0, Method.Length, bytes, cur);
            cur += Method.Length;

            if (Json != null)
            {
                WriteBytes(Json.Length, bytes, cur);
                cur += 4;
                Encoding.UTF8.GetBytes(Json, 0, Json.Length, bytes, cur);
                cur += Json.Length;
            }
            else
            {
                cur += 4;
            }

            WriteBytes(RequestKey, bytes, cur);
            cur += 8;

            WriteBytes(PoolAllCount, bytes, cur);
            cur += 4;

            if (bytes.Length > 1024 * 1024 * 5)
            {
                throw new ArgumentException("The message is longer than 5mb.");
            }
            return bytes;
        }

        private static unsafe void WriteBytes(int value, byte[] buffer, int offset)
        {
            fixed (byte* numPtr = &buffer[offset])
                *(int*)numPtr = value;
        }
        private static unsafe void WriteBytes(long value, byte[] buffer, int offset)
        {
            fixed (byte* numPtr = &buffer[offset])
                *(long*)numPtr = value;
        }

        public static Message Parse(byte[] bytes)
        {
            try
            {
                var message = new Message();

                int cur = 4;

                message.Direction = (MessageDirection)bytes[cur++];
                message.Type = (MessageType)bytes[cur++];
                message.ResponseOptions = (ResponseOptions)bytes[cur++];
                message.From = BitConverter.ToInt64(bytes, cur);
                cur += 8;

                switch (message.Type)
                {
                    case MessageType.Client:
                        message.ToClient = BitConverter.ToInt64(bytes, cur);
                        cur += 8;
                        break;
                    case MessageType.Pool:
                    case MessageType.PoolAll:
                        var toPoolLength = BitConverter.ToInt32(bytes, cur);
                        cur += 4;
                        message.ToPool = Encoding.UTF8.GetString(bytes, cur, toPoolLength);
                        cur += toPoolLength;
                        break;
                }


                var methodLength = BitConverter.ToInt32(bytes, cur);
                cur += 4;
                message.Method = Encoding.UTF8.GetString(bytes, cur, methodLength);
                cur += methodLength;

                var jsonLength = BitConverter.ToInt32(bytes, cur);
                cur += 4;

                if (jsonLength > 0)
                {
                    message.Json = Encoding.UTF8.GetString(bytes, cur, jsonLength);
                    cur += jsonLength;
                }

                message.RequestKey = BitConverter.ToInt64(bytes, cur);
                cur += 8;
                message.PoolAllCount = BitConverter.ToInt32(bytes, cur);
                cur += 4;

                return message;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed Receive message:");
                Console.WriteLine($"{Encoding.UTF8.GetString(bytes)}");
                Console.WriteLine($"{ex}");
                return null;
            }
        }

        public T GetJson<T>()
        {
            if (Json != null)
                return Json.FromJson<T>();
            return default(T);
        }

        public static Message BuildServerRequest(string method, ResponseOptions options = ResponseOptions.SingleResponse)
        {
            return new Message()
            {
                Method = method,
                Direction = MessageDirection.Request,
                Type = MessageType.Server,
                ResponseOptions = options
            };
        }

        public static Message BuildServerResponse(string method, ResponseOptions options = ResponseOptions.SingleResponse)
        {
            return new Message()
            {
                Method = method,
                Direction = MessageDirection.Response,
                Type = MessageType.Client,
                ResponseOptions = options
            };
        }
    }


    public enum ResponseOptions
    {
        SingleResponse = 1,
        OpenResponse = 2
    }

    public enum MessageDirection
    {
        Request = 1,
        Response = 2
    }

    public enum MessageType
    {
        Client = 1,
        Pool = 2,
        PoolAll = 3,
        Server = 4
    }
}