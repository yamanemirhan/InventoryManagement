
namespace InventoryManagement.Application.Common.Exceptions;

public sealed class ConcurrencyException(string message, Exception innerException) : Exception(message, innerException);