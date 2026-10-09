using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Assistant.Queries.GetAssistantInsights;
public sealed class GetAssistantInsightsQueryHandler(IAssistantContextReader reader, ICompanyContext company)
    : IRequestHandler<GetAssistantInsightsQuery, AssistantInsights>
{
    public Task<AssistantInsights> Handle(GetAssistantInsightsQuery request, CancellationToken ct)
    { AssistantAccess.Check(company); return reader.GetInsightsAsync(request.Locale, request.Page, ct); }
}
