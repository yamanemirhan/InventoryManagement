using InventoryManagement.Domain.Common;
namespace InventoryManagement.Domain.Entities;

public class Company : Entity
{
    public string Name { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
public class CompanyMember : Entity
{
    public Guid CompanyId { get; set; }
    public string SubjectId { get; set; } = "";
    public string Role { get; set; } = "Viewer";
}
public class ApplicationUser
{
    public string SubjectId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
}
public static class CompanyRoles
{
    public static readonly string[] All = ["Owner", "Manager", "Operator", "Viewer"];
}
