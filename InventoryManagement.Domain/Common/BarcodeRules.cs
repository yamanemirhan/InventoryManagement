namespace InventoryManagement.Domain.Common;
public static class BarcodeRules
{
    public static IReadOnlyList<string> Variants(string value)
    {
        // UPC-A and zero-prefixed EAN-13 encode the same GTIN.
        if (value.Length is 12 or 13 && value.All(c => c is >= '0' and <= '9'))
        {
            if (value.Length == 12) return [value, "0" + value];
            if (value[0] == '0') return [value, value[1..]];
        }
        return [value];
    }
    public static bool IsValid(string? value) => string.IsNullOrEmpty(value) ||
        (value.Length <= 100 && value.All(c => c is >= '!' and <= '~') && !value.StartsWith("inventory:", StringComparison.OrdinalIgnoreCase));
}
