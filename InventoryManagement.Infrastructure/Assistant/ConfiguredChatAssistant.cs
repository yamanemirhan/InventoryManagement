using InventoryManagement.Application.Assistant;
namespace InventoryManagement.Infrastructure.Assistant;
public sealed class ConfiguredChatAssistant(GeminiChatAssistant gemini, GroqChatAssistant groq) : IChatAssistant
{
    private IChatAssistant Selected => groq.GetConfiguration().Available ? groq : gemini;
    public AssistantConfiguration GetConfiguration() => Selected.GetConfiguration();
    public Task<AssistantReply> ReplyAsync(AssistantConversation conversation, string subjectId, CancellationToken ct) =>
        Selected.ReplyAsync(conversation, subjectId, ct);
}
