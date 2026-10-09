using FluentValidation;
namespace InventoryManagement.Application.Assistant.Queries.GetAssistantInsights;
public sealed class GetAssistantInsightsQueryValidator : AbstractValidator<GetAssistantInsightsQuery>
{
    public GetAssistantInsightsQueryValidator()
    {
        RuleFor(x => x.Locale).Must(x => x is "tr" or "en");
        RuleFor(x => x.Page).Must(x => x is "overview" or "products" or "stocks" or "purchases" or "reports" or "knowledge");
    }
}
