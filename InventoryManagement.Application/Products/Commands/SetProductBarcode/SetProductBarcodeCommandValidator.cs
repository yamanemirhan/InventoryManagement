using FluentValidation;
using InventoryManagement.Domain.Common;
namespace InventoryManagement.Application.Products.Commands.SetProductBarcode;
public sealed class SetProductBarcodeCommandValidator : AbstractValidator<SetProductBarcodeCommand>
{
    public SetProductBarcodeCommandValidator()
    { RuleFor(x => x.Id).NotEmpty(); RuleFor(x => x.Barcode).Must(x => BarcodeRules.IsValid(x?.Trim())).WithMessage("Barcode must contain at most 100 printable ASCII characters and cannot use the inventory: prefix."); }
}
