using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Assistant;
internal static class AssistantAccess
{
    internal static void Check(ICompanyContext company)
    {
        if (company.CompanyId == Guid.Empty || company.Role is not ("Owner" or "Manager" or "Operator" or "Viewer"))
            throw new ForbiddenException();
    }
}
