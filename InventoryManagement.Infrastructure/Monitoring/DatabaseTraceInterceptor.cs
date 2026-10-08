using System.Data.Common;
using System.Diagnostics;
using InventoryManagement.Application.Common.Telemetry;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace InventoryManagement.Infrastructure.Monitoring;

// SQL text, parameters and connection strings are intentionally never attached to spans.
public sealed class DatabaseTraceInterceptor : DbCommandInterceptor
{
    private static void Record(TimeSpan duration, bool error = false)
    {
        // Background polling has no request parent and does not need a trace every two seconds.
        if (Activity.Current is null) return;
        using var span = InventoryTelemetry.Activities.StartActivity("database.command", ActivityKind.Client,
            Activity.Current.Context, startTime: DateTimeOffset.UtcNow - duration);
        span?.SetTag("db.system.name", "postgresql");
        if (error) { span?.SetTag("error.type", "DatabaseCommandFailure"); span?.SetStatus(ActivityStatusCode.Error); }
    }
    public override ValueTask<DbDataReader> ReaderExecutedAsync(DbCommand command, CommandExecutedEventData eventData, DbDataReader result, CancellationToken ct = default)
    { Record(eventData.Duration); return ValueTask.FromResult(result); }
    public override ValueTask<int> NonQueryExecutedAsync(DbCommand command, CommandExecutedEventData eventData, int result, CancellationToken ct = default)
    { Record(eventData.Duration); return ValueTask.FromResult(result); }
    public override ValueTask<object?> ScalarExecutedAsync(DbCommand command, CommandExecutedEventData eventData, object? result, CancellationToken ct = default)
    { Record(eventData.Duration); return ValueTask.FromResult(result); }
    public override Task CommandFailedAsync(DbCommand command, CommandErrorEventData eventData, CancellationToken ct = default)
    { Record(eventData.Duration, true); return Task.CompletedTask; }
}
