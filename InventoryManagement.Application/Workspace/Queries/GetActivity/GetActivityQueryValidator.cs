using FluentValidation;
namespace InventoryManagement.Application.Workspace.Queries.GetActivity;

public sealed class GetActivityQueryValidator : AbstractValidator<GetActivityQuery>
{
    public GetActivityQueryValidator()
    {
        RuleFor(x => x.Page).InclusiveBetween(1, 1000000);

    }
}
