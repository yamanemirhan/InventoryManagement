
using FluentValidation;

namespace InventoryManagement.Application.Stocks.Commands.IncreaseStock;

public sealed class IncreaseStockCommandValidator : AbstractValidator<IncreaseStockCommand>
{
    public IncreaseStockCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty();

        RuleFor(x => x.WarehouseId)
            .NotEmpty();

        RuleFor(x => x.Quantity)
            .GreaterThan(0);
    }
}