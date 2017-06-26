namespace OnPoolCommon.Models
{
    public class GetAllPoolsResponse
    {
        public string[] PoolNames { get; set; }
    }

    public class ClientPingResponse
    {
        public long ClientId { get; set; }
    }

}