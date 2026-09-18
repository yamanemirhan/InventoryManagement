
using FluentValidation;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Common.Exceptions;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        // Do not serialize exception messages: database/identity errors may contain private values.
        if (exception is not (ValidationException or ForbiddenException or KeyNotFoundException or DomainException or ConcurrencyException or InvalidOperationException))
            logger.LogError("Unhandled {ExceptionType}; TraceId {TraceId}; Stack {StackTrace}",
                exception.GetType().Name, httpContext.TraceIdentifier, exception.StackTrace);

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
