
using InventoryManagement.Domain.Common;
using InventoryManagement.Domain.Exceptions;

namespace InventoryManagement.Domain.Entities;

public class Stock : CompanyEntity
{
    private Stock() { }
    public Stock(Guid productId, Guid warehouseId)
    {
        ProductId = productId;
        WarehouseId = warehouseId;
        Quantity = 0;
    }

    public Guid ProductId { get; private set; }
    public Guid WarehouseId { get; private set; }
    public int Quantity { get; private set; }
    public uint Version { get; private set; }
    public int MinimumQuantity { get; private set; }
    public int CountRevision { get; private set; }
    public void SetMinimum(int minimum)
    {
        if (minimum < 0) throw new DomainException("Minimum stock cannot be negative.");
        MinimumQuantity = minimum;
    }
    public void Count(int quantity)
    {
        if (quantity < 0) throw new DomainException("Counted stock cannot be negative.");
        Quantity = quantity;
        CountRevision++;
    }


    public void Increase(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero.");

        if (quantity > int.MaxValue - Quantity)
            throw new DomainException("Stock quantity exceeds the supported maximum.");
        Quantity += quantity;
    }

    public void Decrease(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero.");

        if (Quantity - quantity < 0)
            throw new DomainException("Insufficient stock to decrease.");

        Quantity -= quantity;
    }
}
