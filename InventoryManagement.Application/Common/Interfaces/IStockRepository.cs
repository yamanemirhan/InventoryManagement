
using InventoryManagement.Domain.Entities;

namespace InventoryManagement.Application.Common.Interfaces;

public interface IStockRepository
{
    Task<Stock?> GetAsync(Guid productId, Guid warehouseId, CancellationToken cancellationToken = default);

    Task AddAsync(Stock stock, CancellationToken cancellationToken = default);
}