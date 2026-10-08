using InventoryManagement.Application.Companies.Common;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Commands.RunMonitoringDiagnostic;

public sealed record RunMonitoringDiagnosticCommand(string Scenario) : IRequest<DiagnosticResult>;
