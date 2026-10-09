using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Assistant.Queries.GetAssistantConfiguration;
public sealed class GetAssistantConfigurationQueryHandler(IChatAssistant assistant, ICompanyContext company)
    : IRequestHandler<GetAssistantConfigurationQuery, AssistantConfiguration>
{
    public Task<AssistantConfiguration> Handle(GetAssistantConfigurationQuery request, CancellationToken ct)
    {
        AssistantAccess.Check(company);
        var cloud = assistant.GetConfiguration();
        return Task.FromResult(cloud with { Available = true, CloudAvailable = cloud.Available,
            CompanyCloudAvailable = cloud.Available && cloud.Provider == "Groq" });
    }
}
