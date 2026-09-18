using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.Stocks.Commands.CountStock;

public sealed class CountStockCommandHandler(IStockRepository stocks, ICatalogRepository catalog, IUnitOfWork unitOfWork, IStockCountRepository counts, IStockMovementRepository movements, ICurrentUser user) : IRequestHandler<CountStockCommand>
{
    public async Task Handle(CountStockCommand request, CancellationToken ct)
    {
        if (await catalog.GetProductAsync(request.ProductId, ct) is null || await catalog.GetWarehouseAsync(request.WarehouseId, ct) is null) throw new KeyNotFoundException("Product or warehouse not found.");
        var stock = await stocks.GetAsync(request.ProductId, request.WarehouseId, ct);
        if ((stock?.Version ?? 0) != request.ExpectedVersion) throw new ConcurrencyException("Stock changed. Reload before saving.");
        if (stock is null) { stock = new Stock(request.ProductId, request.WarehouseId); await stocks.AddAsync(stock, ct); }
        var previous = stock.Quantity;
        stock.Count(request.Quantity);
        await counts.AddAsync(new StockCount
        {
            ProductId = request.ProductId,
            WarehouseId = request.WarehouseId,
            PreviousQuantity = previous,
            CountedQuantity = request.Quantity,
            Reason = request.Reason.Trim(),
            ActorSubjectId = user.SubjectId
        }, ct);
        var delta = request.Quantity - previous;
        if (delta != 0) await movements.AddAsync(new StockMovement(request.ProductId, request.WarehouseId, StockMovementType.Adjustment, Math.Abs(delta)).Annotate(request.Reason, delta), ct);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
