using System;

namespace BrokerCommon
{
    public class Swimmer
    {
        public SocketLayer Client { get; }
        public string Id { get; set; }

        public Swimmer(SocketLayer client, string swimmerId)
        {
            this.Client = client;
            this.Id = swimmerId;
        }


        public void SendMessage(Query query)
        {
            query.Add("~ToSwimmer~", this.Id);
            Client.SendMessage(query);
        }

        public void SendMessageWithResponse(Query query, Action<Query> callback) 
        {
            query.Add("~ToSwimmer~", this.Id);
            Client.SendMessageWithResponse(query, callback);
        }
    }
}