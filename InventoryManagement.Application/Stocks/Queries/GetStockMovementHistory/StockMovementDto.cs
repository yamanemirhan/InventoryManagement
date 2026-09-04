
using InventoryManagement.Domain.Enums;

namespace InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;

public sealed record StockMovementDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string Sku,
    StockMovementType Type,
    int Quantity,
    Guid WarehouseId,
    Guid? RelatedWarehouseId,
    DateTime CreatedAtUtc);