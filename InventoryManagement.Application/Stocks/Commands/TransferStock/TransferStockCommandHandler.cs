
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using InventoryManagement.Domain.Exceptions;
using MediatR;

namespace InventoryManagement.Application.Stocks.Commands.TransferStock;

public sealed class TransferStockCommandHandler(IStockRepository stockRepository, IStockMovementRepository stockMovementRepository, IUnitOfWork unitOfWork)
    : IRequestHandler<TransferStockCommand>
{
    // decrease the stock quantity in the source warehouse (if it exists)
    // and increase the stock quantity in the target warehouse (if it exists, otherwise create a new stock entry for the target warehouse)
    // throw ConcurrencyException if the stock version has changed during the operation
    public async Task Handle(TransferStockCommand request, CancellationToken cancellationToken)
    {
        const int maxAttempts = 2;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                var sourceStock = await stockRepository.GetAsync(request.ProductId, request.SourceWarehouseId, cancellationToken);

                if (sourceStock is null)
                    throw new DomainException("Product does not exist in source warehouse.");

                var targetStock = await stockRepository.GetAsync(request.ProductId, request.TargetWarehouseId, cancellationToken);

                if (targetStock is null)
                {
                    targetStock = new Stock(request.ProductId, request.TargetWarehouseId);
                    await stockRepository.AddAsync(targetStock, cancellationToken);
                }

                sourceStock.Decrease(request.Quantity);
                targetStock.Increase(request.Quantity);

                var movement = new StockMovement(
                    request.ProductId,
                    request.SourceWarehouseId,
                    StockMovementType.Transfer,
                    request.Quantity,
                    request.TargetWarehouseId);

                await stockMovementRepository.AddAsync(movement, cancellationToken);
                await unitOfWork.SaveChangesAsync(cancellationToken);

                return;
            }
            catch (ConcurrencyException) when (attempt < maxAttempts)
            {
                unitOfWork.ClearChanges();
            }
        }
    }
}