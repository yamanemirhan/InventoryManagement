using System.Diagnostics;
using System.Diagnostics.Metrics;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Common.Telemetry;

// Type names are a bounded set. Never attach command fields, company IDs or user identities.
public sealed class TelemetryBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse> where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var operation = typeof(TRequest).Name;
        using var activity = InventoryTelemetry.Activities.StartActivity(operation);
        var start = Stopwatch.GetTimestamp();
        var outcome = "success";
        try { return await next(ct); }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { outcome = "cancelled"; throw; }
        catch (Exception ex)
        {
            outcome = ex switch { ConcurrencyException => "conflict", ForbiddenException => "forbidden",
                InventoryManagement.Application.Assistant.AssistantException { Code: "assistant_quota" or "assistant_busy" } => "throttled",
                InventoryManagement.Application.Assistant.AssistantException { Code: "assistant_blocked" } => "rejected",
                InventoryManagement.Application.Assistant.AssistantException => "unavailable",
                ValidationException or DomainException or InvalidOperationException => "rejected", KeyNotFoundException => "not_found", _ => "error" };
            activity?.SetTag("error.type", ex.GetType().Name);
            if (outcome == "error") activity?.SetStatus(ActivityStatusCode.Error);
            throw;
        }
        finally
        {
            activity?.SetTag("inventory.outcome", outcome);
            var tags = new TagList { { "operation", operation }, { "outcome", outcome } };
            InventoryTelemetry.Operations.Add(1, tags);
            InventoryTelemetry.Duration.Record(Stopwatch.GetElapsedTime(start).TotalSeconds, tags);
        }
    }
}
