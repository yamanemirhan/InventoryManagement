namespace InventoryManagement.Application.Common.Interfaces;

public interface ICurrentUser
{
    string SubjectId { get; }
    string Name { get; }
    string Email { get; }
    bool IsPlatformAdmin { get; }
}
