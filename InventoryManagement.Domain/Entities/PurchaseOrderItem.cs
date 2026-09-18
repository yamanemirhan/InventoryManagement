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

    public int ReceivedQuantity { get; private set; }
    public int ReturnedQuantity { get; private set; }
    public void Receive(int quantity)
    {
        if (quantity <= 0 || quantity > Quantity - ReceivedQuantity) throw new DomainException("Receipt exceeds the outstanding quantity.");
        ReceivedQuantity += quantity;
    }
    public void Return(int quantity)
    {
        if (quantity <= 0 || quantity > ReceivedQuantity - ReturnedQuantity) throw new DomainException("Return exceeds the received quantity.");
        ReturnedQuantity += quantity;
    }
    public decimal TotalPrice => Quantity * UnitPrice;
}
