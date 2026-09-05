using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using MediatR;
namespace InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;

public sealed class GetStockMovementHistoryPageQueryValidator : AbstractValidator<GetStockMovementHistoryPageQuery>
{
    public GetStockMovementHistoryPageQueryValidator()
    {
        RuleFor(x => x.WarehouseId).NotEmpty();
        RuleFor(x => x.Page).InclusiveBetween(1, 1000000);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
