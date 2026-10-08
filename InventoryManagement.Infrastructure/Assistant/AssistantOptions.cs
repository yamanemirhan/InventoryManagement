namespace InventoryManagement.Infrastructure.Assistant;
public sealed class AssistantOptions
{
    public bool Enabled { get; set; }
    public bool FreeTierConfirmed { get; set; }
    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "gemini-3.8-flash";
}
