
using InventoryManagement.Application.Stocks.Commands.TransferStock;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Exceptions;
using InventoryManagement.Infrastructure.Persistence;
using InventoryManagement.Infrastructure.Persistence.Repositories;
using InventoryManagement.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.IntegrationTests.Infrastructure;

public class StockConcurrencyTests(PostgresFixture fixture) : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task UpdatingSameStockFromTwoContexts_ShouldThrowConcurrencyException()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(fixture.ConnectionString)
            .Options;

        Guid stockId;

        await using (var seedContext = new AppDbContext(options, fixture))
        {
            var product = new Product("Keyboard", $"KB-{Guid.NewGuid()}");
            var warehouse = new Warehouse("Main", "Istanbul");

            seedContext.Products.Add(product);
            seedContext.Warehouses.Add(warehouse);

            var stock = new Stock(product.Id, warehouse.Id);
            stock.Increase(10);

            seedContext.Stocks.Add(stock);
            await seedContext.SaveChangesAsync();

            stockId = stock.Id;
        }

        await using var contextA = new AppDbContext(options, fixture);
        await using var contextB = new AppDbContext(options, fixture);

        var stockA = await contextA.Stocks.SingleAsync(x => x.Id == stockId);
        var stockB = await contextB.Stocks.SingleAsync(x => x.Id == stockId);

        stockA.Decrease(7);
        await contextA.SaveChangesAsync();

        stockB.Decrease(1);

        var exception = await Assert.ThrowsAsync<ConcurrencyException>(() =>
            contextB.SaveChangesAsync());

        Assert.IsType<DbUpdateConcurrencyException>(exception.InnerException);
    }

    [Fact]
    public async Task Transfer_WhenConcurrencyOccurs_ShouldReloadAndRetry()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(fixture.ConnectionString)
            .Options;

        Guid productId;
        Guid sourceId;
        Guid targetId;

        await using (var seed = new AppDbContext(options, fixture))
        {
            var product = new Product("Mouse", $"M-{Guid.NewGuid()}");
            var source = new Warehouse("Source", "Istanbul");
            var target = new Warehouse("Target", "Ankara");

            seed.Products.Add(product);
            seed.Warehouses.AddRange(source, target);

            var sourceStock = new Stock(product.Id, source.Id);
            sourceStock.Increase(10);

            var targetStock = new Stock(product.Id, target.Id);

            seed.Stocks.AddRange(sourceStock, targetStock);
            await seed.SaveChangesAsync();

            productId = product.Id;
            sourceId = source.Id;
            targetId = target.Id;
        }

        await using var contextA = new AppDbContext(options, fixture);
        await using var contextB = new AppDbContext(options, fixture);

        await contextB.Stocks.SingleAsync(x => x.ProductId == productId && x.WarehouseId == sourceId);
        await contextB.Stocks.SingleAsync(x => x.ProductId == productId && x.WarehouseId == targetId);

        var stockA = await contextA.Stocks.SingleAsync(
            x => x.ProductId == productId && x.WarehouseId == sourceId);

        stockA.Decrease(7);
        await contextA.SaveChangesAsync();

        var handler = new TransferStockCommandHandler(
            new StockRepository(contextB),
            new StockMovementRepository(contextB),
            contextB);

        await handler.Handle(
            new TransferStockCommand(productId, sourceId, targetId, 1),
            CancellationToken.None);

        await using var verify = new AppDbContext(options, fixture);

        var sourceStockFromDb = await verify.Stocks.SingleAsync(
            x => x.ProductId == productId && x.WarehouseId == sourceId);

        var targetStockFromDb = await verify.Stocks.SingleAsync(
            x => x.ProductId == productId && x.WarehouseId == targetId);

        Assert.Equal(2, sourceStockFromDb.Quantity);
        Assert.Equal(1, targetStockFromDb.Quantity);
    }

    [Fact]
    public async Task Transfer_WhenRetryFindsInsufficientStock_ShouldNotTransfer()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(fixture.ConnectionString)
            .Options;

        Guid productId;
        Guid sourceId;
        Guid targetId;

        await using (var seed = new AppDbContext(options, fixture))
        {
            var product = new Product("Monitor", $"MON-{Guid.NewGuid()}");
            var source = new Warehouse("Source", "Istanbul");
            var target = new Warehouse("Target", "Ankara");

            seed.Products.Add(product);
            seed.Warehouses.AddRange(source, target);

            var sourceStock = new Stock(product.Id, source.Id);
            sourceStock.Increase(10);

            seed.Stocks.AddRange(
                sourceStock,
                new Stock(product.Id, target.Id));

            await seed.SaveChangesAsync();

            productId = product.Id;
            sourceId = source.Id;
            targetId = target.Id;
        }

        await using var contextA = new AppDbContext(options, fixture);
        await using var contextB = new AppDbContext(options, fixture);

        await contextB.Stocks.SingleAsync(x => x.ProductId == productId && x.WarehouseId == sourceId);
        await contextB.Stocks.SingleAsync(x => x.ProductId == productId && x.WarehouseId == targetId);

        var stockA = await contextA.Stocks.SingleAsync(
            x => x.ProductId == productId && x.WarehouseId == sourceId);

        stockA.Decrease(7);
        await contextA.SaveChangesAsync();

        var handler = new TransferStockCommandHandler(
            new StockRepository(contextB),
            new StockMovementRepository(contextB),
            contextB);

        await Assert.ThrowsAsync<DomainException>(() =>
            handler.Handle(
                new TransferStockCommand(productId, sourceId, targetId, 6),
                CancellationToken.None));

        await using var verify = new AppDbContext(options, fixture);

        var sourceStockFromDb = await verify.Stocks.SingleAsync(
            x => x.ProductId == productId && x.WarehouseId == sourceId);

        var targetStockFromDb = await verify.Stocks.SingleAsync(
            x => x.ProductId == productId && x.WarehouseId == targetId);

        var movementExists = await verify.StockMovements.AnyAsync(
            x => x.ProductId == productId &&
                 x.WarehouseId == sourceId &&
                 x.RelatedWarehouseId == targetId);

        Assert.Equal(3, sourceStockFromDb.Quantity);
        Assert.Equal(0, targetStockFromDb.Quantity);
        Assert.False(movementExists);
    }
}
