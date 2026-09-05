using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Queries;

public sealed class GetPurchaseOrdersQueryHandler(IPurchaseOrderReadRepository repository) : IRequestHandler<GetPurchaseOrdersQuery, PagedResult<PurchaseOrderListItemDto>>
{
    public Task<PagedResult<PurchaseOrderListItemDto>> Handle(GetPurchaseOrdersQuery request, CancellationToken ct) =>
        repository.GetPageAsync(request.Page, request.PageSize, ct);
}
