using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Commands.Lifecycle;

public sealed class MarkPurchaseOrderAsOrderedCommandHandler(IPurchaseOrderRepository orders, IUnitOfWork unitOfWork) : IRequestHandler<MarkPurchaseOrderAsOrderedCommand>
{
    public async Task Handle(MarkPurchaseOrderAsOrderedCommand request, CancellationToken ct)
    {
        var order = await orders.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException("Purchase order not found.");
        order.MarkAsOrdered();
        await unitOfWork.SaveChangesAsync(ct);
    }
}
