using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace InventoryManagement.Api.Common.Authentication;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddInventoryAuthentication(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        services.AddOptions<InventoryIdentityOptions>().Bind(configuration.GetSection("Authentication"))
            .Validate(x => Uri.TryCreate(x.Authority, UriKind.Absolute, out var uri) &&
                (uri.Scheme == "https" || (environment.IsDevelopment() && uri.Scheme == "http" && uri.IsLoopback)),
                "Authentication:Authority must be an absolute HTTPS issuer URL (localhost HTTP is allowed only in Development).")
            .Validate(x => !string.IsNullOrWhiteSpace(x.Audience), "Authentication:Audience is required.")
            .ValidateOnStart();
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<InventoryIdentityOptions>>((options, settings) =>
            {
                var identity = settings.Value;
                options.Authority = identity.Authority.TrimEnd('/');
                options.Audience = identity.Audience;
                options.RequireHttpsMetadata = !environment.IsDevelopment();
                options.MapInboundClaims = false;
                options.IncludeErrorDetails = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true, ValidIssuer = options.Authority,
                    ValidateAudience = true, ValidAudience = identity.Audience,
                    ValidateLifetime = true, RequireExpirationTime = true,
                    ValidateIssuerSigningKey = true, RequireSignedTokens = true,
                    ValidAlgorithms = [SecurityAlgorithms.RsaSha256],
                    NameClaimType = "preferred_username", RoleClaimType = ClaimTypes.Role,
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        var claims = (ClaimsIdentity)context.Principal!.Identity!;
                        var realmAccess = claims.FindFirst("realm_access")?.Value;
                        if (realmAccess is not null)
                        {
                            try
                            {
                                using var document = JsonDocument.Parse(realmAccess);
                                if (document.RootElement.TryGetProperty("roles", out var roles) && roles.ValueKind == JsonValueKind.Array)
                                    foreach (var role in roles.EnumerateArray())
                                        if (role.ValueKind == JsonValueKind.String && role.GetString() is "Admin" or "User")
                                            claims.AddClaim(new Claim(ClaimTypes.Role, role.GetString()!));
                            }
                            catch (JsonException) { context.Fail("Invalid role claims."); }
                        }
                        return Task.CompletedTask;
                    },
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        context.Response.Headers.WWWAuthenticate = "Bearer";
                        await Results.Problem(statusCode: 401, title: IsTurkish ? "Oturum gerekli" : "Authentication required",
                            detail: IsTurkish ? "Devam etmek için giriş yapın." : "Sign in to continue.").ExecuteAsync(context.HttpContext);
                    },
                    OnForbidden = async context => await Results.Problem(statusCode: 403,
                        title: IsTurkish ? "Erişim reddedildi" : "Access denied",
                        detail: IsTurkish ? "Bu işlem için yetkiniz yok." : "You do not have permission to perform this action.").ExecuteAsync(context.HttpContext)
                };
            });
        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
            options.AddPolicy(InventoryPolicies.Read, policy => policy.RequireAuthenticatedUser().RequireRole("Admin", "User"));
            options.AddPolicy(InventoryPolicies.Manage, policy => policy.RequireAuthenticatedUser().RequireRole("Admin"));
            options.AddPolicy(InventoryPolicies.Transfer, policy => policy.RequireAuthenticatedUser().RequireRole("Admin", "User"));
        });
        return services;
    }
    private static bool IsTurkish => System.Globalization.CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "tr";
}
