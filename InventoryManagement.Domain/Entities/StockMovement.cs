
using InventoryManagement.Domain.Common;
using InventoryManagement.Domain.Enums;
using InventoryManagement.Domain.Exceptions;

namespace InventoryManagement.Domain.Entities;

// for audit/history purposes, we keep a record of all stock movements, including transfers between warehouses and adjustments.
// This allows us to track the flow of inventory and maintain accurate records for reporting and analysis.
public class StockMovement : CompanyEntity
{
    private StockMovement() { }

    public StockMovement(Guid productId, Guid warehouseId, StockMovementType type, int quantity, Guid? relatedWarehouseId = null)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero.");

        ProductId = productId;
        WarehouseId = warehouseId;
        Type = type;
        Quantity = quantity;
        RelatedWarehouseId = relatedWarehouseId;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public string? Reason { get; private set; }
    public int? SignedDelta { get; private set; }
    public Guid? PurchaseOrderId { get; private set; }
    public StockMovement Annotate(string reason, int delta, Guid? purchaseOrderId = null)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length > 500) throw new DomainException("A reason of up to 500 characters is required.");
        Reason = reason.Trim(); SignedDelta = delta; PurchaseOrderId = purchaseOrderId;
        return this;
    }
    public Guid ProductId { get; private set; }
    public Guid WarehouseId { get; private set; }
    public StockMovementType Type { get; private set; }
    public int Quantity { get; private set; }
    public Guid? RelatedWarehouseId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
}
