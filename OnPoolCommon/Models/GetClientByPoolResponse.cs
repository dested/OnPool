namespace OnPoolCommon.Models
{
    public class GetClientByPoolResponse
    {
        public ClientResponse[] Clients { get; set; }
    }
    public class ClientResponse
    {
        public string Id { get; set; }
    }
}