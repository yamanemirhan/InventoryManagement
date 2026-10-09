using InventoryManagement.Application.Companies.Common;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Commands.RunMonitoringDiagnostic;

public sealed class RunMonitoringDiagnosticCommandHandler(IMonitoringDiagnostics diagnostics, CompanyAccess access)
    : IRequestHandler<RunMonitoringDiagnosticCommand, DiagnosticResult>
{
    public Task<DiagnosticResult> Handle(RunMonitoringDiagnosticCommand request, CancellationToken ct)
    { access.RequirePlatformAdmin(); return diagnostics.RunAsync(request.Scenario, ct); }
}
