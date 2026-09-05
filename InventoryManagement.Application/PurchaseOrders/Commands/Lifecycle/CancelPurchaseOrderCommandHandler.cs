using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Commands.Lifecycle;

public sealed class CancelPurchaseOrderCommandHandler(IPurchaseOrderRepository orders, IUnitOfWork unitOfWork) : IRequestHandler<CancelPurchaseOrderCommand>
{
    public async Task Handle(CancelPurchaseOrderCommand request, CancellationToken ct)
    {
        var order = await orders.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException("Purchase order not found.");
        order.Cancel();
        await unitOfWork.SaveChangesAsync(ct);
    }
}
