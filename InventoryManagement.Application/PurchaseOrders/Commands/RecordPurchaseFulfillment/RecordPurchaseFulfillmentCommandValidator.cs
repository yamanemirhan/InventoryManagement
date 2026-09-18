using FluentValidation;
namespace InventoryManagement.Application.PurchaseOrders.Commands.RecordPurchaseFulfillment;

public sealed class RecordPurchaseFulfillmentCommandValidator : AbstractValidator<RecordPurchaseFulfillmentCommand>
{
    public RecordPurchaseFulfillmentCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty(); RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Lines).NotNull().NotEmpty().Must(x => x is not null && x.Count <= 100 && x.All(l => l is not null) && x.Select(l => l.ProductId).Distinct().Count() == x.Count);
        RuleForEach(x => x.Lines).NotNull().ChildRules(line => { line.RuleFor(x => x.ProductId).NotEmpty(); line.RuleFor(x => x.Quantity).GreaterThan(0); });
    }
}
