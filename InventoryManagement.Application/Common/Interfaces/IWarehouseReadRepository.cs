using InventoryManagement.Application.Warehouses.Queries.GetWarehouses;

namespace InventoryManagement.Application.Common.Interfaces;

public interface IWarehouseReadRepository
{
    Task<WarehouseDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WarehouseDto>> GetAllAsync(
        CancellationToken cancellationToken = default);
}
