using FluentValidation;
namespace InventoryManagement.Application.Stocks.Commands.SetMinimumStock;

public sealed class SetMinimumStockCommandValidator : AbstractValidator<SetMinimumStockCommand>
{
    public SetMinimumStockCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty(); RuleFor(x => x.WarehouseId).NotEmpty();
        RuleFor(x => x.MinimumQuantity).GreaterThanOrEqualTo(0);

    }
}
