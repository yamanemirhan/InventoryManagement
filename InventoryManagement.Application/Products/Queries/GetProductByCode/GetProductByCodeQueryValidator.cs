using FluentValidation;
namespace InventoryManagement.Application.Products.Queries.GetProductByCode;
public sealed class GetProductByCodeQueryValidator : AbstractValidator<GetProductByCodeQuery>
{
    public GetProductByCodeQueryValidator()
    { RuleFor(x => x.Code).NotEmpty().MaximumLength(200).Must(x => x is null || !x.Any(char.IsControl)).WithMessage("Invalid scanned code."); }
}
