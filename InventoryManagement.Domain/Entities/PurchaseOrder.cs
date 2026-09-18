
using InventoryManagement.Domain.Common;
using InventoryManagement.Domain.Enums;
using InventoryManagement.Domain.Exceptions;

namespace InventoryManagement.Domain.Entities;

public class PurchaseOrder : CompanyEntity
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
    public uint Version { get; private set; }
    public int FulfillmentRevision { get; private set; }

    public IReadOnlyCollection<PurchaseOrderItem> Items => _items;

    public decimal TotalAmount => _items.Sum(x => x.TotalPrice);

    public void AddItem(Guid productId, int quantity, decimal unitPrice)
    {
        // means that items can only be added to draft orders.
        // If the order is not in draft status, it throws a DomainException.
        if (Status != PurchaseOrderStatus.Draft)
            throw new DomainException("Items can only be added to draft orders.");

        if (_items.Any(x => x.ProductId == productId))
            throw new DomainException("A product can only appear once in an order.");
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
        if (Status is not (PurchaseOrderStatus.Ordered or PurchaseOrderStatus.PartiallyReceived))
            throw new DomainException("Only outstanding purchases can be received.");
        foreach (var item in _items.Where(x => x.ReceivedQuantity < x.Quantity)) item.Receive(item.Quantity - item.ReceivedQuantity);
        Status = PurchaseOrderStatus.Received;
        FulfillmentRevision++;
    }

    public void Receive(Guid productId, int quantity)
    {
        if (Status is not (PurchaseOrderStatus.Ordered or PurchaseOrderStatus.PartiallyReceived)) throw new DomainException("This order cannot receive stock.");
        var item = _items.SingleOrDefault(x => x.ProductId == productId) ?? throw new DomainException("Product is not in this order.");
        item.Receive(quantity);
        Status = _items.All(x => x.ReceivedQuantity == x.Quantity) ? PurchaseOrderStatus.Received : PurchaseOrderStatus.PartiallyReceived;
        FulfillmentRevision++;
    }
    public void Return(Guid productId, int quantity)
    {
        if (Status is not (PurchaseOrderStatus.Received or PurchaseOrderStatus.PartiallyReceived)) throw new DomainException("Only received goods can be returned.");
        var item = _items.SingleOrDefault(x => x.ProductId == productId) ?? throw new DomainException("Product is not in this order.");
        item.Return(quantity);
        FulfillmentRevision++;
    }
    public void Cancel()
    {
        if (Status is not (PurchaseOrderStatus.Draft or PurchaseOrderStatus.Ordered))
            throw new DomainException("Only draft or ordered purchases can be cancelled.");

        Status = PurchaseOrderStatus.Cancelled;
    }
}
