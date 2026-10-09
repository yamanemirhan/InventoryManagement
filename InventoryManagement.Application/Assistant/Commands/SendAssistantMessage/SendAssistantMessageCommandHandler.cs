using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Assistant.Commands.SendAssistantMessage;
public sealed class SendAssistantMessageCommandHandler(IChatAssistant assistant, ICompanyContext company, ICurrentUser user)
    : IRequestHandler<SendAssistantMessageCommand, AssistantReply>
{
    public Task<AssistantReply> Handle(SendAssistantMessageCommand request, CancellationToken ct)
    {
        AssistantAccess.Check(company);
        return assistant.ReplyAsync(new(request.Locale, request.Page, request.Messages), user.SubjectId, ct);
    }
}
