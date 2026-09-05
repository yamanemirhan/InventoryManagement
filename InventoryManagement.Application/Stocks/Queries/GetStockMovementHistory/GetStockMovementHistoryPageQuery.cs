using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using MediatR;
namespace InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;

public sealed record GetStockMovementHistoryPageQuery(Guid WarehouseId, int Page = 1, int PageSize = 20) : IRequest<PagedResult<StockMovementDto>>;
