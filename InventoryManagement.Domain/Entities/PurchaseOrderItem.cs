using InventoryManagement.Domain.Common;
using InventoryManagement.Domain.Exceptions;

namespace InventoryManagement.Domain.Entities;

public class PurchaseOrderItem : CompanyEntity
{
    private PurchaseOrderItem() { }

    public PurchaseOrderItem(
        Guid productId,
        int quantity,
        decimal unitPrice)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero.");

        if (unitPrice < 0)
            throw new DomainException("Unit price cannot be negative.");

        ProductId = productId;
        Quantity = quantity;
        UnitPrice = unitPrice;
    }

    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }

    public decimal TotalPrice => Quantity * UnitPrice;
}
