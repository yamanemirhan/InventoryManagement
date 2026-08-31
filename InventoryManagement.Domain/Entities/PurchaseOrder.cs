
using InventoryManagement.Domain.Common;
using InventoryManagement.Domain.Enums;
using InventoryManagement.Domain.Exceptions;

namespace InventoryManagement.Domain.Entities;

public class PurchaseOrder : Entity
{
    private readonly List<PurchaseOrderItem> _items = [];

    private PurchaseOrder() { }

    public PurchaseOrder(Guid supplierId, Guid warehouseId)
    {
        SupplierId = supplierId;
        WarehouseId = warehouseId;
        Status = PurchaseOrderStatus.Draft;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid SupplierId { get; private set; }
    public Guid WarehouseId { get; private set; }
    public PurchaseOrderStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public IReadOnlyCollection<PurchaseOrderItem> Items => _items;

    public decimal TotalAmount => _items.Sum(x => x.TotalPrice);

    public void AddItem(Guid productId, int quantity, decimal unitPrice)
    {
        // means that items can only be added to draft orders.
        // If the order is not in draft status, it throws a DomainException.
        if (Status != PurchaseOrderStatus.Draft)
            throw new DomainException("Items can only be added to draft orders.");

        _items.Add(new PurchaseOrderItem(productId, quantity, unitPrice));
    }

    public void MarkAsOrdered()
    {
        if (Status != PurchaseOrderStatus.Draft)
            throw new DomainException("Only draft orders can be ordered.");

        if (_items.Count == 0)
            throw new DomainException("Order must contain at least one item.");

        Status = PurchaseOrderStatus.Ordered;
    }

    public void MarkAsReceived()
    {
        if (Status != PurchaseOrderStatus.Ordered)
            throw new DomainException("Only ordered purchases can be received.");

        Status = PurchaseOrderStatus.Received;
    }

    public void Cancel()
    {
        if (Status == PurchaseOrderStatus.Received)
            throw new DomainException("Received orders cannot be cancelled.");

        Status = PurchaseOrderStatus.Cancelled;
    }
}