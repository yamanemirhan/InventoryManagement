namespace InventoryManagement.Application.Assistant;

public sealed record AssistantMessage(string Role, string Text);
public sealed record AssistantConversation(string Locale, string Page, IReadOnlyList<AssistantMessage> Messages,
    AssistantContext? Context = null);
public sealed record AssistantConfiguration(bool Available, string Name, string Provider, string Model,
    int MaxMessageLength = 2000, int MaxHistoryMessages = 11, bool CloudAvailable = false, bool CompanyCloudAvailable = false);
public sealed record AssistantReply(string Text, bool Truncated = false, IReadOnlyList<AssistantSource>? Sources = null,
    string Mode = "cloud", string? NoticeCode = null, int RetryAfterSeconds = 0, DateTime? RetrievedAtUtc = null);
public sealed record AssistantSource(string Key, string Kind, Guid Id, string Title, string Excerpt, string Href, int? Revision = null);
public sealed record AssistantInsight(string Id, string Severity, string Title, string Detail, string Href, string Question);
public sealed record AssistantInsights(DateTime RetrievedAtUtc, IReadOnlyList<AssistantInsight> Items);
public sealed record AssistantContext(DateTime RetrievedAtUtc, IReadOnlyList<AssistantSource> Sources, IReadOnlyList<AssistantInsight> Insights);
public interface IAssistantContextReader
{
    Task<AssistantContext> RetrieveAsync(string question, string locale, string page, CancellationToken ct);
    Task<AssistantInsights> GetInsightsAsync(string locale, string page, CancellationToken ct);
}
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
