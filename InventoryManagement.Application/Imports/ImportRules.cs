using System.Globalization;
using System.Net.Mail;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Exceptions;

namespace InventoryManagement.Application.Imports;

public static class ImportRules
{
    public static readonly string[] Kinds = ["products", "warehouses", "suppliers", "stocks", "purchase-orders"];
    public static void RequireAccess(ICompanyContext company)
    {
        if (company.CompanyId == Guid.Empty || company.Role is not ("Owner" or "Manager")) throw new ForbiddenException();
    }
    public static void RequireRequest(string kind, IReadOnlyList<ImportRow>? rows)
    {
        if (!Kinds.Contains(kind) || rows is null || rows.Count is < 1 or > 1000 || rows.Any(r => r is null))
            throw new DomainException("Select a supported import type and provide 1-1000 rows.");
    }
    public static string Text(string? text) => text?.Trim() ?? "";
    public static bool Integer(string? text, out int value) => int.TryParse(Text(text), NumberStyles.None, CultureInfo.InvariantCulture, out value);
    public static bool Price(string? text, out decimal value) => decimal.TryParse(Text(text), NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out value)
        && value is >= 0 and <= 9999999999999999.99m && decimal.Round(value, 2) == value;
    public static bool ValidEmail(string? text) => MailAddress.TryCreate(Text(text), out var email) && email.Address == Text(text) && email.Host.Contains('.');
}
