using System.Collections.Concurrent;

namespace InventoryManagement.Api.Realtime;

public sealed record WorkspaceConnection(string Id, Guid CompanyId, string SubjectId, bool Admin, DateTimeOffset ExpiresAt);
public sealed class WorkspaceConnections
{
    private readonly ConcurrentDictionary<string, WorkspaceConnection> connections = new();
    public void Add(WorkspaceConnection connection) => connections[connection.Id] = connection;
    public void Remove(string id) => connections.TryRemove(id, out _);
    public WorkspaceConnection[] Snapshot() => connections.Values.ToArray();
}
