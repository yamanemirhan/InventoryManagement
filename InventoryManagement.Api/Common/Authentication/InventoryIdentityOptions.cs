namespace InventoryManagement.Api.Common.Authentication;

public sealed class InventoryIdentityOptions
{
    public string Authority { get; set; } = "";
    public string Audience { get; set; } = "inventory-api";
}
