using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Queries;

public sealed record GetPurchaseOrdersQuery(int Page = 1, int PageSize = 20) : IRequest<PagedResult<PurchaseOrderListItemDto>>;
