namespace BrokerCommon.Models
{
    public class GetPoolByNameResponse
    {
        public string PoolName { get; set; }
        public int NumberOfSwimmers { get; set; }
    }
    public class GetAllPoolsResponse
    {
        public string[] PoolNames { get; set; }
    }

    public class GetSwimmerByPoolResponse
    {
        public SwimmerResponse[] Swimmers { get; set; }
    }

    public class SwimmerResponse
    {
        public string Id { get; set; }
    }
}