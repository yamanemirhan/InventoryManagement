using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Assistant.Queries.GetAssistantConfiguration;
public sealed class GetAssistantConfigurationQueryHandler(IChatAssistant assistant, ICompanyContext company)
    : IRequestHandler<GetAssistantConfigurationQuery, AssistantConfiguration>
{
    public Task<AssistantConfiguration> Handle(GetAssistantConfigurationQuery request, CancellationToken ct)
    { AssistantAccess.Check(company); return Task.FromResult(assistant.GetConfiguration()); }
}
