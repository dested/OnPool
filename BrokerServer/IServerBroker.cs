using System;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerServer
{
    public interface IServerBroker
    {
        void AddSwimmer(SocketLayer client);
        void RemoveSwimmer(SocketLayer client);


        GetAllPoolsResponse GetAllPools();
        GetPoolByNameResponse GetPoolByName(string poolName);
        void JoinPool(SocketLayer client, string poolName);
        GetSwimmerByPoolResponse GetSwimmersInPool(string poolName);

        void SendMessageToSwimmerWithResponse(Query query, Action<Query> respond);
        void SendMessageToPoolWithResponse(Query query, Action<Query> respond);
        void SendMessageToPoolAllWithResponse(Query query, Action<Query> respond);

        void SendMessageToSwimmer(Query query);
        void SendMessageToPool(Query query);
        void SendMessageToPoolAll(Query query);
    }
}