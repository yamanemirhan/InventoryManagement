using InventoryManagement.Application.Companies.Common;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Queries.GetMonitoringLogs;

public sealed class GetMonitoringLogsQueryValidator : AbstractValidator<GetMonitoringLogsQuery>
{
    public GetMonitoringLogsQueryValidator()
    {
        RuleFor(x => x.Level).Must(x => x is "all" or "error" or "warning");
        RuleFor(x => x.TraceId).Matches("^[a-f0-9]{32}$").When(x => x.TraceId is not null);
    }
}
