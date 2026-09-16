
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using InventoryManagement.Infrastructure.Persistence;
using InventoryManagement.Infrastructure.Persistence.Repositories;
using InventoryManagement.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.IntegrationTests.Infrastructure;

public class StockRepositoryTests(PostgresFixture fixture) : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task IncreaseStock_ShouldPersistStockAndMovement()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(fixture.ConnectionString)
            .Options;

        await using var dbContext = new AppDbContext(options, fixture);

        var product = new Product("Keyboard", $"KB-{Guid.NewGuid()}");
        var warehouse = new Warehouse("Main Warehouse", "Istanbul");

        dbContext.Products.Add(product);
        dbContext.Warehouses.Add(warehouse);
        await dbContext.SaveChangesAsync();

        var stockRepository = new StockRepository(dbContext);
        var movementRepository = new StockMovementRepository(dbContext);

        var stock = new Stock(product.Id, warehouse.Id);
        stock.Increase(10);

        var movement = new StockMovement(
            product.Id,
            warehouse.Id,
            StockMovementType.In,
            10);

        await stockRepository.AddAsync(stock);
        await movementRepository.AddAsync(movement);
        await dbContext.SaveChangesAsync();

        var savedStock = await dbContext.Stocks.SingleAsync();
        var savedMovement = await dbContext.StockMovements.SingleAsync();

        Assert.Equal(10, savedStock.Quantity);
        Assert.Equal(10, savedMovement.Quantity);
        Assert.Equal(StockMovementType.In, savedMovement.Type);
    }
}