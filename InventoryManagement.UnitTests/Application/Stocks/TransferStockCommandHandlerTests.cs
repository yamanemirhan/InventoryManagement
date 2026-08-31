
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Stocks.Commands.TransferStock;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Exceptions;
using NSubstitute;

namespace InventoryManagement.UnitTests.Application.Stocks;

public class TransferStockCommandHandlerTests
{
    [Fact]
    public async Task Handle_WhenStockIsEnough_ShouldTransfer()
    {
        var stockRepository = Substitute.For<IStockRepository>();
        var movementRepository = Substitute.For<IStockMovementRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();

        var productId = Guid.NewGuid();
        var sourceId = Guid.NewGuid();
        var targetId = Guid.NewGuid();

        var sourceStock = new Stock(productId, sourceId);
        sourceStock.Increase(10);

        var targetStock = new Stock(productId, targetId);
        targetStock.Increase(2);

        stockRepository.GetAsync(productId, sourceId, Arg.Any<CancellationToken>()).Returns(sourceStock);
        stockRepository.GetAsync(productId, targetId, Arg.Any<CancellationToken>()).Returns(targetStock);

        var handler = new TransferStockCommandHandler(stockRepository, movementRepository, unitOfWork);
        var command = new TransferStockCommand(productId, sourceId, targetId, 4);

        await handler.Handle(command, CancellationToken.None);

        Assert.Equal(6, sourceStock.Quantity);
        Assert.Equal(6, targetStock.Quantity);

        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenStockIsInsufficient_ShouldThrowAndNotSave()
    {
        var stockRepository = Substitute.For<IStockRepository>();
        var movementRepository = Substitute.For<IStockMovementRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();

        var productId = Guid.NewGuid();
        var sourceId = Guid.NewGuid();
        var targetId = Guid.NewGuid();

        var sourceStock = new Stock(productId, sourceId);
        sourceStock.Increase(3);

        var targetStock = new Stock(productId, targetId);

        stockRepository.GetAsync(productId, sourceId, Arg.Any<CancellationToken>()).Returns(sourceStock);
        stockRepository.GetAsync(productId, targetId, Arg.Any<CancellationToken>()).Returns(targetStock);

        var handler = new TransferStockCommandHandler(stockRepository, movementRepository, unitOfWork);
        var command = new TransferStockCommand(productId, sourceId, targetId, 5);

        await Assert.ThrowsAsync<DomainException>(() => handler.Handle(command, CancellationToken.None));

        Assert.Equal(3, sourceStock.Quantity);
        Assert.Equal(0, targetStock.Quantity);

        await unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}