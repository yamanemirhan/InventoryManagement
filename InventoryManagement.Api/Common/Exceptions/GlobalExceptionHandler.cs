
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
        logger.LogError(exception, "An unhandled exception occurred.");

        if (exception is ValidationException validationException)
        {
            // group validation errors by property name and return them in the response
            var errors = validationException.Errors.GroupBy(x => x.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(x => ErrorMessages.Localize(x.ErrorMessage)).ToArray());

            var validationProblem = new ValidationProblemDetails(errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = ErrorMessages.Localize("Validation Error"),
            };

            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;

            await httpContext.Response.WriteAsJsonAsync(validationProblem, cancellationToken);

            return true;
        }


        var (statusCode, title) = exception switch
        {
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
            Extensions = { ["code"] = exception is ConcurrencyException ? "concurrency_conflict" : "request_failed" }
        };

        httpContext.Response.StatusCode = statusCode;

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
