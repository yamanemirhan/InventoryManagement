
using FluentValidation;
using InventoryManagement.Domain.Common;

namespace InventoryManagement.Application.Products.Commands.CreateProduct;

public sealed class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Sku)
            .NotEmpty()
            .MaximumLength(100);
        RuleFor(x => x.Barcode).Must(x => BarcodeRules.IsValid(x?.Trim()))
            .WithMessage("Barcode must contain at most 100 printable ASCII characters and cannot use the inventory: prefix.");
    }
}
