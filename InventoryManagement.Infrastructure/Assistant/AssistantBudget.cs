using InventoryManagement.Application.Assistant;
namespace InventoryManagement.Infrastructure.Assistant;

// One API instance per environment. No text or company metadata is stored here.
// Provider quotas remain authoritative; restarting this instance resets these local limits.
public sealed class AssistantBudget
{
    private readonly object gate = new();
    private DateOnly day = DateOnly.FromDateTime(DateTime.UtcNow);
    private readonly Dictionary<string, int> users = new(StringComparer.Ordinal);
    private int total, active;
    public IDisposable Acquire(string subject)
    {
        lock (gate)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (today != day) { day = today; total = 0; users.Clear(); }
            if (total >= 40 || users.GetValueOrDefault(subject) >= 20)
                throw new AssistantException("assistant_quota", (int)Math.Ceiling((DateTime.UtcNow.Date.AddDays(1) - DateTime.UtcNow).TotalSeconds));
            if (active >= 2) throw new AssistantException("assistant_busy", 10);
            total++; users[subject] = users.GetValueOrDefault(subject) + 1; active++;
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
