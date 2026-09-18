using FluentValidation;
namespace InventoryManagement.Application.Reports.Queries.GetStockReport;

public sealed class GetStockReportQueryValidator : AbstractValidator<GetStockReportQuery>
{ public GetStockReportQueryValidator() { RuleFor(x => x.Page).InclusiveBetween(1, 1000000); RuleFor(x => x.PageSize).InclusiveBetween(1, 1000); RuleFor(x => x.Search).MaximumLength(200); } }
