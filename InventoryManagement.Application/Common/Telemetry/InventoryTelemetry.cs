using System.Diagnostics;
using System.Diagnostics.Metrics;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Common.Telemetry;

public static class InventoryTelemetry
{
    public const string Name = "InventoryManagement";
    public static readonly ActivitySource Activities = new(Name);
    public static readonly Meter Meter = new(Name);
    public static readonly Counter<long> Operations = Meter.CreateCounter<long>("inventory.operations");
    public static readonly Histogram<double> Duration = Meter.CreateHistogram<double>("inventory.operation.duration", "s");
}

