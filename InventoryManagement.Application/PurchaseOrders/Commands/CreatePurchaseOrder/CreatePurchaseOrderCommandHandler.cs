using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Commands.CreatePurchaseOrder;

public sealed class CreatePurchaseOrderCommandHandler(IPurchaseOrderRepository orders, ISupplierRepository suppliers,
    IWarehouseReadRepository warehouses, IProductRepository products, IUnitOfWork unitOfWork) : IRequestHandler<CreatePurchaseOrderCommand, Guid>
{
    public async Task<Guid> Handle(CreatePurchaseOrderCommand request, CancellationToken ct)
    {
        _ = await suppliers.GetByIdAsync(request.SupplierId, ct) ?? throw new KeyNotFoundException("Supplier not found.");
        _ = await warehouses.GetByIdAsync(request.WarehouseId, ct) ?? throw new KeyNotFoundException("Warehouse not found.");
        var order = new PurchaseOrder(request.SupplierId, request.WarehouseId);
        foreach (var item in request.Items)
        {
            _ = await products.GetByIdAsync(item.ProductId, ct) ?? throw new KeyNotFoundException("Product not found.");
            order.AddItem(item.ProductId, item.Quantity, item.UnitPrice);
        }
        await orders.AddAsync(order, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return order.Id;
    }
}
