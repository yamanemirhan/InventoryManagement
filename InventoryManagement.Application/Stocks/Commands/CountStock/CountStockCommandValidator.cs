using FluentValidation;
namespace InventoryManagement.Application.Stocks.Commands.CountStock;

public sealed class CountStockCommandValidator : AbstractValidator<CountStockCommand>
{
    public CountStockCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty(); RuleFor(x => x.WarehouseId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
    }
}
