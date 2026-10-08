using InventoryManagement.Application.Companies.Common;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Queries.GetMonitoringTrace;

public sealed class GetMonitoringTraceQueryValidator : AbstractValidator<GetMonitoringTraceQuery>
{ public GetMonitoringTraceQueryValidator() { RuleFor(x => x.TraceId).Matches("^[a-f0-9]{32}$"); } }
