
using InventoryManagement.Domain.Entities;
using InventoryManagement.Infrastructure.Persistence;
using InventoryManagement.Infrastructure.Persistence.Repositories;
using InventoryManagement.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.IntegrationTests.Infrastructure;

public class StockReadRepositoryTests(PostgresFixture fixture) : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task GetWarehouseStockAsync_ShouldReturnProductData()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(fixture.ConnectionString)
            .Options;

        await using var dbContext = new AppDbContext(options);

        var product = new Product("Keyboard", $"KB-{Guid.NewGuid()}");
        var warehouse = new Warehouse("Main", "Istanbul");
        var stock = new Stock(product.Id, warehouse.Id);

        stock.Increase(12);

        dbContext.Products.Add(product);
        dbContext.Warehouses.Add(warehouse);
        dbContext.Stocks.Add(stock);

        await dbContext.SaveChangesAsync();

        var repository = new StockReadRepository(dbContext);

        var result = await repository.GetWarehouseStockAsync(warehouse.Id);

        var item = Assert.Single(result);

        Assert.Equal(product.Id, item.ProductId);
        Assert.Equal("Keyboard", item.ProductName);
        Assert.Equal(12, item.Quantity);
    }
}