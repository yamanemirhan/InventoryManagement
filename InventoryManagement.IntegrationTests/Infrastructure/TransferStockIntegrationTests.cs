
using InventoryManagement.Application.Stocks.Commands.TransferStock;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using InventoryManagement.Domain.Exceptions;
using InventoryManagement.Infrastructure.Persistence;
using InventoryManagement.Infrastructure.Persistence.Repositories;
using InventoryManagement.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.IntegrationTests.Infrastructure;

public class TransferStockIntegrationTests(PostgresFixture fixture) : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task Transfer_ShouldPersistBothStocksAndMovement()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(fixture.ConnectionString)
            .Options;

        await using var dbContext = new AppDbContext(options);

        var product = new Product("Keyboard", $"KB-{Guid.NewGuid()}");
        var sourceWarehouse = new Warehouse("Source", "Istanbul");
        var targetWarehouse = new Warehouse("Target", "Ankara");

        dbContext.Products.Add(product);
        dbContext.Warehouses.AddRange(sourceWarehouse, targetWarehouse);
        await dbContext.SaveChangesAsync();

        var sourceStock = new Stock(product.Id, sourceWarehouse.Id);
        sourceStock.Increase(10);

        dbContext.Stocks.Add(sourceStock);
        await dbContext.SaveChangesAsync();

        var stockRepository = new StockRepository(dbContext);
        var movementRepository = new StockMovementRepository(dbContext);

        var handler = new TransferStockCommandHandler(
            stockRepository,
            movementRepository,
            dbContext);

        await handler.Handle(
            new TransferStockCommand(product.Id, sourceWarehouse.Id, targetWarehouse.Id, 4),
            CancellationToken.None);

        dbContext.ChangeTracker.Clear();

        var source = await dbContext.Stocks.SingleAsync(
            x => x.ProductId == product.Id && x.WarehouseId == sourceWarehouse.Id);

        var target = await dbContext.Stocks.SingleAsync(
            x => x.ProductId == product.Id && x.WarehouseId == targetWarehouse.Id);

        var movement = await dbContext.StockMovements.SingleAsync(
            x => x.ProductId == product.Id);

        Assert.Equal(6, source.Quantity);
        Assert.Equal(4, target.Quantity);
        Assert.Equal(4, movement.Quantity);
        Assert.Equal(StockMovementType.Transfer, movement.Type);
    }

    [Fact]
    public async Task Transfer_WhenStockIsInsufficient_ShouldNotChangeDatabase()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(fixture.ConnectionString)
            .Options;

        Guid productId;
        Guid sourceWarehouseId;
        Guid targetWarehouseId;

        await using (var dbContext = new AppDbContext(options))
        {
            var product = new Product("Mouse", $"MOUSE-{Guid.NewGuid()}");
            var sourceWarehouse = new Warehouse("Source 2", "Istanbul");
            var targetWarehouse = new Warehouse("Target 2", "Izmir");

            dbContext.Products.Add(product);
            dbContext.Warehouses.AddRange(sourceWarehouse, targetWarehouse);

            var sourceStock = new Stock(product.Id, sourceWarehouse.Id);
            sourceStock.Increase(3);

            dbContext.Stocks.Add(sourceStock);
            await dbContext.SaveChangesAsync();

            productId = product.Id;
            sourceWarehouseId = sourceWarehouse.Id;
            targetWarehouseId = targetWarehouse.Id;

            var handler = new TransferStockCommandHandler(
                new StockRepository(dbContext),
                new StockMovementRepository(dbContext),
                dbContext);

            await Assert.ThrowsAsync<DomainException>(() =>
                handler.Handle(
                    new TransferStockCommand(productId, sourceWarehouseId, targetWarehouseId, 10),
                    CancellationToken.None));
        }

        await using var verifyContext = new AppDbContext(options);

        var sourceStockFromDb = await verifyContext.Stocks.SingleAsync(
            x => x.ProductId == productId && x.WarehouseId == sourceWarehouseId);

        var targetExists = await verifyContext.Stocks.AnyAsync(
            x => x.ProductId == productId && x.WarehouseId == targetWarehouseId);

        var movementExists = await verifyContext.StockMovements.AnyAsync(
            x => x.ProductId == productId &&
                 x.WarehouseId == sourceWarehouseId &&
                 x.RelatedWarehouseId == targetWarehouseId);

        Assert.Equal(3, sourceStockFromDb.Quantity);
        Assert.False(targetExists);
        Assert.False(movementExists);
    }
}