using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Assistant.Commands.SendAssistantMessage;
public sealed class SendAssistantMessageCommandHandler(IChatAssistant assistant, IAssistantContextReader reader, ICompanyContext company, ICurrentUser user)
    : IRequestHandler<SendAssistantMessageCommand, AssistantReply>
{
    public async Task<AssistantReply> Handle(SendAssistantMessageCommand request, CancellationToken ct)
    {
        AssistantAccess.Check(company);
        var context = request.Mode == "company"
            ? await reader.RetrieveAsync(request.Messages[^1].Text, request.Locale, request.Page, ct) : null;
        var cloud = assistant.GetConfiguration();
        // Gemini's unpaid service must not receive retrieved confidential company data.
        var canSend = request.ExternalProcessingAccepted && cloud.Available && (context is null || cloud.Provider == "Groq");
        if (!canSend) return LocalAssistantReply.Create(context, request.Locale, request.ExternalProcessingAccepted && context is not null ? "company_cloud_not_configured" : null);
        try
        {
            var reply = await assistant.ReplyAsync(new(request.Locale, request.Page, request.Messages, context), user.SubjectId, ct);
            return reply with { Sources = context?.Sources, RetrievedAtUtc = context?.RetrievedAtUtc };
        }
        catch (AssistantException ex) when (ex.Code != "assistant_blocked")
        {
            return LocalAssistantReply.Create(context, request.Locale, ex.Code, ex.RetryAfterSeconds);
        }
    }
}
