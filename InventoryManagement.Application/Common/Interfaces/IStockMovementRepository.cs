
using InventoryManagement.Domain.Entities;

namespace InventoryManagement.Application.Common.Interfaces;

public interface IStockMovementRepository
{
    Task AddAsync(StockMovement movement, CancellationToken cancellationToken = default);
}