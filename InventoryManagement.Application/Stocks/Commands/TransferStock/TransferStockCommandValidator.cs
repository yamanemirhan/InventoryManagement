
using FluentValidation;

namespace InventoryManagement.Application.Stocks.Commands.TransferStock;

public sealed class TransferStockCommandValidator : AbstractValidator<TransferStockCommand>
{
    public TransferStockCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.SourceWarehouseId).NotEmpty();
        RuleFor(x => x.TargetWarehouseId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);

        RuleFor(x => x.TargetWarehouseId)
            .NotEqual(x => x.SourceWarehouseId)
            .WithMessage("Source and target warehouse cannot be the same.");
    }
}