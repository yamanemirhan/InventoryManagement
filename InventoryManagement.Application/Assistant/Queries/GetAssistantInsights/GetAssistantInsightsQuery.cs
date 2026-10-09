using MediatR;
namespace InventoryManagement.Application.Assistant.Queries.GetAssistantInsights;
public sealed record GetAssistantInsightsQuery(string Locale = "tr", string Page = "overview") : IRequest<AssistantInsights>;
