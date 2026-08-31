
using FluentValidation;

namespace InventoryManagement.Application.Warehouses.Commands.CreateWarehouse;

public sealed class CreateWarehouseCommandValidator : AbstractValidator<CreateWarehouseCommand>
{
    public CreateWarehouseCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(x => x.Location)
            .NotEmpty()
            .MaximumLength(300);
    }
}
