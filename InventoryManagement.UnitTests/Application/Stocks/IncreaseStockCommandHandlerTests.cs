
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Stocks.Commands.IncreaseStock;
using InventoryManagement.Domain.Entities;
using NSubstitute;

namespace InventoryManagement.UnitTests.Application.Stocks;

public class IncreaseStockCommandHandlerTests
{
    [Fact]
    public async Task Handle_WhenStockExists_ShouldIncreaseStockAndSave()
    {
        var stockRepository = Substitute.For<IStockRepository>();
        var movementRepository = Substitute.For<IStockMovementRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();

        var productId = Guid.NewGuid();
        var warehouseId = Guid.NewGuid();

        var stock = new Stock(productId, warehouseId);
        stock.Increase(5);

        stockRepository.GetAsync(productId, warehouseId, Arg.Any<CancellationToken>()).Returns(stock);

        var handler = new IncreaseStockCommandHandler(stockRepository, movementRepository, unitOfWork);
        var command = new IncreaseStockCommand(productId, warehouseId, 10);

        await handler.Handle(command, CancellationToken.None);

        Assert.Equal(15, stock.Quantity);

        await movementRepository.Received(1).AddAsync(
            Arg.Is<StockMovement>(x => x.ProductId == productId && x.WarehouseId == warehouseId && x.Quantity == 10),
            Arg.Any<CancellationToken>());

        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenStockDoesNotExist_ShouldCreateStock()
    {
        var stockRepository = Substitute.For<IStockRepository>();
        var movementRepository = Substitute.For<IStockMovementRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();

        var productId = Guid.NewGuid();
        var warehouseId = Guid.NewGuid();

        stockRepository.GetAsync(productId, warehouseId, Arg.Any<CancellationToken>())
            .Returns((Stock?)null);

        var handler = new IncreaseStockCommandHandler(stockRepository, movementRepository, unitOfWork);
        var command = new IncreaseStockCommand(productId, warehouseId, 10);

        await handler.Handle(command, CancellationToken.None);

        await stockRepository.Received(1).AddAsync(
            Arg.Is<Stock>(x => x.ProductId == productId && x.WarehouseId == warehouseId && x.Quantity == 10),
            Arg.Any<CancellationToken>());

        await movementRepository.Received(1).AddAsync(
            Arg.Is<StockMovement>(x => x.Quantity == 10),
            Arg.Any<CancellationToken>());

        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}