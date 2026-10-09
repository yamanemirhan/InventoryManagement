using InventoryManagement.Api.Common.Exceptions;
using InventoryManagement.Application;
using InventoryManagement.Infrastructure;
using InventoryManagement.Api.Common.Authentication;
using InventoryManagement.Api.Common.Operations;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options => options.IncludeScopes = true);
builder.AddInventoryTelemetry();
builder.Services.AddOperations();
builder.Services.AddSingleton<InventoryManagement.Application.Monitoring.IMonitoringDiagnostics, MonitoringDiagnostics>();
if (!string.IsNullOrWhiteSpace(builder.Configuration["Observability:OtlpEndpoint"]))
    builder.Services.AddHostedService<BusinessMetricsWorker>();

// Add services to the container.

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddHealthChecks();

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<InventoryManagement.Api.Realtime.WorkspaceConnections>();
if (builder.Configuration.GetValue("Operations:RunDispatchers", true))
    builder.Services.AddHostedService<InventoryManagement.Api.Realtime.WorkspaceEventDispatcher>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<InventoryManagement.Application.Common.Interfaces.ICurrentUser, CurrentUser>();
builder.Services.AddScoped<CompanyContext>();
builder.Services.AddScoped<InventoryManagement.Application.Common.Interfaces.ICompanyContext>(sp => sp.GetRequiredService<CompanyContext>());
builder.Services.AddInventoryAuthentication(builder.Configuration, builder.Environment);
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// other services
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();



if (builder.Configuration.GetValue("Operations:RunDispatchers", true))
    builder.Services.AddHostedService<InvitationEmailDispatcher>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseHttpsRedirection();
}

app.UseMiddleware<RequestDiagnosticsMiddleware>();
app.UseExceptionHandler();

app.UseCors("Frontend");
app.UseRequestLocalization(options => options.SetDefaultCulture("en")
    .AddSupportedCultures("en", "tr").AddSupportedUICultures("en", "tr"));

app.UseAuthentication();
app.UseRateLimiter();
app.UseMiddleware<CompanyContextMiddleware>();
app.UseAuthorization();

app.MapHealthChecks("/health", new HealthCheckOptions { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/api/health", new HealthCheckOptions { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/api/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") }).AllowAnonymous();
app.MapControllers();
app.MapHub<InventoryManagement.Api.Realtime.WorkspaceHub>("/api/realtime/workspace", options =>
{
    options.CloseOnAuthenticationExpiration = true;
});

app.Run();
