using InventoryManagement.Api.Common.Exceptions;
using InventoryManagement.Application;
using InventoryManagement.Infrastructure;
using InventoryManagement.Api.Common.Authentication;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddHealthChecks();

builder.Services.AddControllers();
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



var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseHttpsRedirection();
}

app.UseExceptionHandler();

app.UseCors("Frontend");
app.UseRequestLocalization(options => options.SetDefaultCulture("en")
    .AddSupportedCultures("en", "tr").AddSupportedUICultures("en", "tr"));

app.UseAuthentication();
app.UseMiddleware<CompanyContextMiddleware>();
app.UseAuthorization();

app.MapHealthChecks("/health").AllowAnonymous();
app.MapHealthChecks("/api/health").AllowAnonymous();
app.MapControllers();

app.Run();
