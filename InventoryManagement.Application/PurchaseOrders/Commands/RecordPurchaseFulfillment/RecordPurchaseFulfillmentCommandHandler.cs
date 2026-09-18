using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Commands.RecordPurchaseFulfillment;

public sealed class RecordPurchaseFulfillmentCommandHandler(IPurchaseOrderRepository orders, IStockRepository stocks, IStockMovementRepository movements, IUnitOfWork unitOfWork) : IRequestHandler<RecordPurchaseFulfillmentCommand>
{
    public async Task Handle(RecordPurchaseFulfillmentCommand request, CancellationToken ct)
    {
        var order = await orders.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException("Purchase order not found.");
        if (order.Version != request.ExpectedVersion) throw new ConcurrencyException("Order changed. Reload before saving.");
        foreach (var line in request.Lines.OrderBy(x => x.ProductId))
        {
            if (request.IsReturn) order.Return(line.ProductId, line.Quantity); else order.Receive(line.ProductId, line.Quantity);
            var stock = await stocks.GetAsync(line.ProductId, order.WarehouseId, ct);
            if (stock is null) { stock = new Stock(line.ProductId, order.WarehouseId); await stocks.AddAsync(stock, ct); }
            if (request.IsReturn) stock.Decrease(line.Quantity); else stock.Increase(line.Quantity);
            await movements.AddAsync(new StockMovement(line.ProductId, order.WarehouseId, request.IsReturn ? StockMovementType.Out : StockMovementType.In, line.Quantity)
               .Annotate(request.Reason, request.IsReturn ? -line.Quantity : line.Quantity, order.Id), ct);
        }
        await unitOfWork.SaveChangesAsync(ct);
    }
}
