
using FluentValidation;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using InventoryManagement.Application.Assistant;

namespace InventoryManagement.Api.Common.Exceptions;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        // Do not serialize exception messages: database/identity errors may contain private values.
        if (exception is not (ValidationException or ForbiddenException or KeyNotFoundException or DomainException or ConcurrencyException or InvalidOperationException or AssistantException))
            logger.LogError("Unhandled {ExceptionType}; TraceId {TraceId}; Stack {StackTrace}",
                exception.GetType().Name, httpContext.TraceIdentifier, exception.StackTrace);

        if (exception is AssistantException assistant)
        {
            var status = assistant.Code is "assistant_quota" or "assistant_provider_quota" or "assistant_daily_limit" or "assistant_busy" ? 429 : assistant.Code == "assistant_blocked" ? 422 : 503;
            if (assistant.RetryAfterSeconds > 0) httpContext.Response.Headers.RetryAfter = assistant.RetryAfterSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture);
            var message = assistant.Code switch
            {
                "assistant_quota" => "The assistant's free quota is temporarily exhausted. Try again later.",
                "assistant_provider_quota" => "The cloud provider's quota is exhausted. Local company retrieval remains available.",
                "assistant_daily_limit" => "The application's daily cloud limit was reached. Local company retrieval remains available.",
                "assistant_busy" => "The assistant is busy. Try again shortly.",
                "assistant_unavailable" => "The assistant is not enabled yet.",
                "assistant_timeout" => "The assistant took too long. Try again shortly.",
                "assistant_blocked" => "The assistant could not answer this message. Rephrase it without sensitive information.",
                _ => "The AI provider is unavailable. Try again later."
            };
            httpContext.Response.StatusCode = status;
            await httpContext.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = "Invo",
                Detail = ErrorMessages.Localize(message), Extensions = { ["code"] = assistant.Code, ["traceId"] = httpContext.TraceIdentifier } }, cancellationToken);
            return true;
        }
        if (exception is ValidationException validationException)
        {
            // group validation errors by property name and return them in the response
            var errors = validationException.Errors.GroupBy(x => x.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(x => ErrorMessages.Localize(x.ErrorMessage)).ToArray());

            var validationProblem = new ValidationProblemDetails(errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = ErrorMessages.Localize("Validation Error"),
                Extensions = { ["traceId"] = httpContext.TraceIdentifier },
            };

            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;

            await httpContext.Response.WriteAsJsonAsync(validationProblem, cancellationToken);

            return true;
        }


        var (statusCode, title) = exception switch
        {
            ForbiddenException => (StatusCodes.Status403Forbidden, "Access denied"),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Not found"),
            DomainException => (StatusCodes.Status400BadRequest, "Business rule violation"),
            ConcurrencyException => (StatusCodes.Status409Conflict, "Concurrency conflict"),
            InvalidOperationException => (StatusCodes.Status409Conflict, "Conflict"),
            _ => (StatusCodes.Status500InternalServerError, "Server error")
        };

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = ErrorMessages.Localize(title),
            Detail = ErrorMessages.Localize(statusCode == 500 ? "An unexpected error occurred. Please try again." : exception.Message),
            Extensions = { ["code"] = exception is ConcurrencyException ? "concurrency_conflict" : "request_failed",
                ["traceId"] = httpContext.TraceIdentifier }
        };

        httpContext.Response.StatusCode = statusCode;

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
