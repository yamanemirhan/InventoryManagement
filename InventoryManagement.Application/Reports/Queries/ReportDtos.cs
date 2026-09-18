using InventoryManagement.Domain.Enums;
namespace InventoryManagement.Application.Reports.Queries;

public sealed record StockReportRow(Guid ProductId, string ProductName, string Sku, Guid WarehouseId, string WarehouseName, int Quantity, int MinimumQuantity, uint Version);
public sealed record MovementReportRow(Guid Id, string ProductName, string Sku, string WarehouseName, string? RelatedWarehouseName, StockMovementType Type, int Quantity, int? SignedDelta, string? Reason, Guid? PurchaseOrderId, DateTime CreatedAtUtc);
public sealed record CountReportRow(Guid Id, string ProductName, string Sku, string WarehouseName, int PreviousQuantity, int CountedQuantity, string Reason, DateTime CreatedAtUtc);
