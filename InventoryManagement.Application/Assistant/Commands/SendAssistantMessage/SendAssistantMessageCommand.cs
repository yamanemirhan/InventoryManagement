using MediatR;
namespace InventoryManagement.Application.Assistant.Commands.SendAssistantMessage;
public sealed record SendAssistantMessageCommand(IReadOnlyList<AssistantMessage> Messages, string Locale = "tr",
    string Page = "overview", bool ExternalProcessingAccepted = false) : IRequest<AssistantReply>;
