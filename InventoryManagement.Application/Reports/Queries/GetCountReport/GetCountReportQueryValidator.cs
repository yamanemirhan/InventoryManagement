using FluentValidation;
namespace InventoryManagement.Application.Reports.Queries.GetCountReport;

public sealed class GetCountReportQueryValidator : AbstractValidator<GetCountReportQuery>
{ public GetCountReportQueryValidator() { RuleFor(x => x.Page).InclusiveBetween(1, 1000000); RuleFor(x => x.PageSize).InclusiveBetween(1, 1000); RuleFor(x => x.Search).MaximumLength(200); RuleFor(x => x).Must(x => !x.From.HasValue || !x.To.HasValue || x.From <= x.To).WithMessage("Start date must precede end date."); } }
