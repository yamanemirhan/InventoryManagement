using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Commands.Lifecycle;

public sealed class ReceivePurchaseOrderCommandHandler(IPurchaseOrderRepository orders, IStockRepository stocks,
    IStockMovementRepository movements, IUnitOfWork unitOfWork) : IRequestHandler<ReceivePurchaseOrderCommand>
{
    public async Task Handle(ReceivePurchaseOrderCommand request, CancellationToken ct)
    {
        var order = await orders.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException("Purchase order not found.");
        // Validate the transition before touching stock. xmin protects against concurrent lifecycle requests.
        var remaining = order.Items.Where(x => x.ReceivedQuantity < x.Quantity).Select(x => new { x.ProductId, Quantity = x.Quantity - x.ReceivedQuantity }).ToList();
        order.MarkAsReceived();
        foreach (var item in remaining.OrderBy(x => x.ProductId))
        {
            var stock = await stocks.GetAsync(item.ProductId, order.WarehouseId, ct);
            if (stock is null)
            {
                stock = new Stock(item.ProductId, order.WarehouseId);
                await stocks.AddAsync(stock, ct);
            }
            stock.Increase(item.Quantity);
            await movements.AddAsync(new StockMovement(item.ProductId, order.WarehouseId, StockMovementType.In, item.Quantity).Annotate("Purchase receipt", item.Quantity, order.Id), ct);
        }
        // EF commits the order, every stock row and every movement in one database transaction.
        await unitOfWork.SaveChangesAsync(ct);
    }
}
