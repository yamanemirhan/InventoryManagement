using InventoryManagement.Application.Companies.Common;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Commands.RunMonitoringDiagnostic;

public sealed class RunMonitoringDiagnosticCommandValidator : AbstractValidator<RunMonitoringDiagnosticCommand>
{
    public RunMonitoringDiagnosticCommandValidator() { RuleFor(x => x.Scenario).Must(x => x is "slow_dependency" or "dependency_failure"); }
}
