using System.Globalization;
using System.Text.Json;
using InventoryManagement.Application.Assistant;
namespace InventoryManagement.Infrastructure.Assistant;

internal static class AssistantProviderResponse
{
    internal static async Task<JsonDocument> ReadAsync(HttpContent content, CancellationToken ct)
    {
        const int limit = 256 * 1024;
        if (content.Headers.ContentLength > limit) throw new AssistantException("assistant_provider_error");
        await using var input = await content.ReadAsStreamAsync(ct);
        using var output = new MemoryStream(); var buffer = new byte[8192]; int size;
        while ((size = await input.ReadAsync(buffer, ct)) > 0)
        {
            if (output.Length + size > limit) throw new AssistantException("assistant_provider_error");
            output.Write(buffer, 0, size);
        }
        return JsonDocument.Parse(output.ToArray());
    }

    internal static async Task<AssistantException> QuotaAsync(HttpResponseMessage response, CancellationToken ct)
    {
        var seconds = response.Headers.RetryAfter?.Delta?.TotalSeconds
            ?? (response.Headers.RetryAfter?.Date is { } date ? (date - DateTimeOffset.UtcNow).TotalSeconds : 60);
        try
        {
            using var body = await ReadAsync(response.Content, ct);
            if (body.RootElement.TryGetProperty("error", out var error) && error.TryGetProperty("details", out var details)
                && details.ValueKind == JsonValueKind.Array)
                foreach (var detail in details.EnumerateArray())
                    if (detail.TryGetProperty("retryDelay", out var retry) && retry.ValueKind == JsonValueKind.String
                        && double.TryParse(retry.GetString()?.TrimEnd('s'), NumberStyles.Float, CultureInfo.InvariantCulture, out var delay))
                        seconds = Math.Max(seconds, delay);
        }
        catch (Exception ex) when (ex is JsonException or AssistantException or InvalidOperationException) { }
        // Return only a fixed code and a bounded delay; provider bodies can include keys or prompts.
        return new("assistant_provider_quota", (int)Math.Clamp(Math.Ceiling(seconds), 1, 86400));
    }
}
