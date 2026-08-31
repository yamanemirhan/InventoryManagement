
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using MediatR;

namespace InventoryManagement.Application.Stocks.Commands.IncreaseStock;

public sealed class IncreaseStockCommandHandler(IStockRepository stockRepository, IStockMovementRepository stockMovementRepository, IUnitOfWork unitOfWork)
    : IRequestHandler<IncreaseStockCommand>
{
    public async Task Handle(IncreaseStockCommand request, CancellationToken cancellationToken)
    {
        var stock = await stockRepository.GetAsync(request.ProductId, request.WarehouseId, cancellationToken);

        if (stock is null)
        {
            stock = new Stock(request.ProductId, request.WarehouseId);

            await stockRepository.AddAsync(stock, cancellationToken);
        }

        stock.Increase(request.Quantity);

        var movement = new StockMovement(request.ProductId, request.WarehouseId, StockMovementType.In, request.Quantity);

        await stockMovementRepository.AddAsync(movement, cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}