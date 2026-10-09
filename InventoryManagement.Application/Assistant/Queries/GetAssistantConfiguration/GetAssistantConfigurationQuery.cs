using MediatR;
namespace InventoryManagement.Application.Assistant.Queries.GetAssistantConfiguration;
public sealed record GetAssistantConfigurationQuery : IRequest<AssistantConfiguration>;
