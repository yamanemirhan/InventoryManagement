using InventoryManagement.Domain.Entities;
namespace InventoryManagement.Application.Common.Interfaces;

public interface ICatalogRepository
{
    Task<Product?> GetProductAsync(Guid id, CancellationToken ct);
    Task<Warehouse?> GetWarehouseAsync(Guid id, CancellationToken ct);
    Task<Supplier?> GetSupplierAsync(Guid id, CancellationToken ct);
}
