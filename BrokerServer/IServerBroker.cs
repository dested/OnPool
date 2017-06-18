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
        void JoinPool(Swimmer client, string poolName);
        GetSwimmerByPoolResponse GetSwimmersInPool(string poolName);

        void ForwardMessageToSwimmerWithResponse(Query query, Action<Query> respond);
        void ForwardMessageToPoolWithResponse(Query query, Action<Query> respond);
        void ForwardMessageToPoolAllWithResponse(Query query, Action<Query> respond);

        void ForwardMessageToSwimmer(Query query);
        void ForwardMessageToPool(Query query);
        void ForwardMessageToPoolAll(Query query);
    }
}