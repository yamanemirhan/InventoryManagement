using InventoryManagement.Application.Assistant;
namespace InventoryManagement.Infrastructure.Assistant;

// One API instance per environment. No text or company metadata is stored here.
// Provider quotas remain authoritative; restarting this instance resets these local limits.
public sealed class AssistantBudget
{
    private readonly object gate = new();
    private DateOnly day = DateOnly.FromDateTime(DateTime.UtcNow);
    private readonly Dictionary<string, int> users = new(StringComparer.Ordinal);
    private readonly Dictionary<string, int> totals = new(StringComparer.Ordinal);
    private readonly Dictionary<string, DateTime> pauses = new(StringComparer.Ordinal);
    private int active;
    public void Pause(string provider, int seconds)
    {
        lock (gate) pauses[provider] = DateTime.UtcNow.AddSeconds(Math.Clamp(seconds, 1, 86400));
    }
    public IDisposable Acquire(string subject, string provider = "gemini")
    {
        lock (gate)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (today != day) { day = today; totals.Clear(); users.Clear(); }
            if (pauses.TryGetValue(provider, out var until) && until > DateTime.UtcNow)
                throw new AssistantException("assistant_provider_quota", (int)Math.Ceiling((until - DateTime.UtcNow).TotalSeconds));
            var userKey = provider + ":" + subject;
            if (totals.GetValueOrDefault(provider) >= (provider == "groq" ? 500 : 40)
                || users.GetValueOrDefault(userKey) >= (provider == "groq" ? 100 : 20))
                throw new AssistantException("assistant_daily_limit", (int)Math.Ceiling((DateTime.UtcNow.Date.AddDays(1) - DateTime.UtcNow).TotalSeconds));
            if (active >= 2) throw new AssistantException("assistant_busy", 10);
            totals[provider] = totals.GetValueOrDefault(provider) + 1;
            users[userKey] = users.GetValueOrDefault(userKey) + 1; active++;
            return new Lease(this);
        }
    }
    private sealed class Lease(AssistantBudget budget) : IDisposable
    {
        private int disposed;
        public void Dispose()
        {
            if (Interlocked.Exchange(ref disposed, 1) == 0) lock (budget.gate) budget.active--;
        }
    }
}
