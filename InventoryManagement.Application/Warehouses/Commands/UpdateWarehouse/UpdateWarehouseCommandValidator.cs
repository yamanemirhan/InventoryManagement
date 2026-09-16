using FluentValidation;
namespace InventoryManagement.Application.Warehouses.Commands.UpdateWarehouse;

public sealed class UpdateWarehouseCommandValidator : AbstractValidator<UpdateWarehouseCommand>
{
    public UpdateWarehouseCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Location).NotEmpty().MaximumLength(300);
    }
}
