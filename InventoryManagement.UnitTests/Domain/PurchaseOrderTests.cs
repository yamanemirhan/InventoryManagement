
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using InventoryManagement.Domain.Exceptions;

namespace InventoryManagement.UnitTests.Domain;

public class PurchaseOrderTests
{
    [Fact]
    public void AddItem_ShouldAddItem()
    {
        var order = new PurchaseOrder(Guid.NewGuid(), Guid.NewGuid());

        order.AddItem(Guid.NewGuid(), quantity: 2, unitPrice: 100);

        Assert.Single(order.Items);
        Assert.Equal(200, order.TotalAmount);
    }

    [Fact]
    public void MarkAsOrdered_WithoutItems_ShouldThrow()
    {
        var order = new PurchaseOrder(Guid.NewGuid(), Guid.NewGuid());

        // we haven't added any items to the order, so marking it as ordered should throw an exception
        Assert.Throws<DomainException>(() => order.MarkAsOrdered());
    }

    [Fact]
    public void MarkAsOrdered_WithItems_ShouldChangeStatus()
    {
        var order = new PurchaseOrder(Guid.NewGuid(), Guid.NewGuid());

        order.AddItem(Guid.NewGuid(), 2, 100);

        order.MarkAsOrdered();

        // after marking as ordered, the status should be changed to Ordered
        Assert.Equal(PurchaseOrderStatus.Ordered, order.Status);
    }

    [Fact]
    public void AddItem_AfterOrdered_ShouldThrow()
    {
        var order = new PurchaseOrder(Guid.NewGuid(), Guid.NewGuid());

        order.AddItem(Guid.NewGuid(), 1, 100);
        order.MarkAsOrdered();

        // after the order is marked as ordered, we shouldn't be able to add more items to it
        Assert.Throws<DomainException>(() => order.AddItem(Guid.NewGuid(), 1, 50));
    }
}