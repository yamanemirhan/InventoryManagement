
namespace InventoryManagement.Domain.Exceptions;

// we will use this exception to represent domain-specific errors in our application.
// For example, if a product is not found in the inventory,
// we can throw a DomainException with a message indicating that the product does not exist.
public class DomainException : Exception
{
    public DomainException(string message) : base(message)
    {
    }
}