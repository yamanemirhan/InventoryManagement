namespace InventoryManagement.Application.Assistant;

public sealed record AssistantMessage(string Role, string Text);
public sealed record AssistantConversation(string Locale, string Page, IReadOnlyList<AssistantMessage> Messages);
public sealed record AssistantConfiguration(bool Available, string Name, string Provider, string Model,
    int MaxMessageLength = 2000, int MaxHistoryMessages = 11);
public sealed record AssistantReply(string Text, bool Truncated = false);
public interface IChatAssistant
{
    AssistantConfiguration GetConfiguration();
    Task<AssistantReply> ReplyAsync(AssistantConversation conversation, string subjectId, CancellationToken ct);
}

public sealed class AssistantException(string code, int retryAfterSeconds = 0) : Exception("Assistant request could not be completed.")
{
    public string Code { get; } = code;
    public int RetryAfterSeconds { get; } = retryAfterSeconds;
}
