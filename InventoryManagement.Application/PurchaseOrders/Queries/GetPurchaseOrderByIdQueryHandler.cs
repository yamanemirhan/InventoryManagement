using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Queries;

public sealed class GetPurchaseOrderByIdQueryHandler(IPurchaseOrderReadRepository repository) : IRequestHandler<GetPurchaseOrderByIdQuery, PurchaseOrderDto>
{
    public async Task<PurchaseOrderDto> Handle(GetPurchaseOrderByIdQuery request, CancellationToken ct) =>
        await repository.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException("Purchase order not found.");
}
