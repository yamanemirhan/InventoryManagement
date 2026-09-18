namespace InventoryManagement.Application.Common.Interfaces;

public interface ICompanyTransaction : IAsyncDisposable
{
    Task CommitAsync(CancellationToken ct);
}
