namespace OnPoolCommon.Models
{
    public class GetClientByPoolResponse
    {
        public ClientResponse[] Clients { get; set; }
    }
    public class ClientResponse
    {
        public long Id { get; set; }
    }
}