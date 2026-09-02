
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Exceptions;

namespace InventoryManagement.UnitTests.Domain;

public class StockTests
{
    [Fact]
    public void Increase_ShouldIncreaseQuantity()
    {
        // Arrange
        var stock = new Stock(Guid.NewGuid(), Guid.NewGuid());
        // Act
        stock.Increase(10);
        // Assert
        Assert.Equal(999, stock.Quantity);
    }

    [Fact]
    public void Decrease_ShouldDecreaseQuantity()
    {
        var stock = new Stock(Guid.NewGuid(), Guid.NewGuid());

        stock.Increase(10);
        stock.Decrease(4);

        Assert.Equal(6, stock.Quantity);
    }

    [Fact]
    public void Decrease_WhenQuantityIsInsufficient_ShouldThrow()
    {
        var stock = new Stock(Guid.NewGuid(), Guid.NewGuid());

        stock.Increase(5);

        // we have 5 in stock, but we are trying to decrease by 10, which should throw an exception
        Assert.Throws<DomainException>(() => stock.Decrease(10));
    }
}
