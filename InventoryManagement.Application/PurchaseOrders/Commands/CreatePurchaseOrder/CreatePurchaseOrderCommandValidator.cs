using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Commands.CreatePurchaseOrder;

public sealed class CreatePurchaseOrderCommandValidator : AbstractValidator<CreatePurchaseOrderCommand>
{
    public CreatePurchaseOrderCommandValidator()
    {
        RuleFor(x => x.SupplierId).NotEmpty();
        RuleFor(x => x.WarehouseId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().Must(x => x is null || x.Count <= 100).WithMessage("An order supports at most 100 items.")
            .Must(x => x is null || x.Where(i => i is not null).Select(i => i.ProductId).Distinct().Count() == x.Count).WithMessage("Each product must appear only once and cannot be null.");
        RuleForEach(x => x.Items).NotNull().ChildRules(item =>
        {
            item.RuleFor(x => x.ProductId).NotEmpty();
            item.RuleFor(x => x.Quantity).InclusiveBetween(1, int.MaxValue);
            item.RuleFor(x => x.UnitPrice).InclusiveBetween(0, 9999999999999999.99m).PrecisionScale(18, 2, true);
        });
    }
}
