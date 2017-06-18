using System;
using BrokerCommon;
using BrokerCommon.Models;

namespace BrokerServer
{
    public interface IServerBroker
    {
        void AddSwimmer(ClientConnection client);
        void RemoveSwimmer(ClientConnection client);


        GetAllPoolsResponse GetAllPools();
        GetPoolByNameResponse GetPoolByName(string poolName);
        void JoinPool(ClientConnection client, string poolName);
        GetSwimmerByPoolResponse GetSwimmersInPool(string poolName);

        void SendMessageToSwimmerWithResponse(Query query, Action<Query> respond);
        void SendMessageToPoolWithResponse(Query query, Action<Query> respond);
        void SendMessageToPoolAllWithResponse(Query query, Action<Query> respond);

        void SendMessageToSwimmer(Query query);
        void SendMessageToPool(Query query);
        void SendMessageToPoolAll(Query query);
    }
}