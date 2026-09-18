using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Commands.RecordPurchaseFulfillment;

public sealed record FulfillmentLine(Guid ProductId, int Quantity);
public sealed record RecordPurchaseFulfillmentCommand(Guid Id, uint ExpectedVersion, bool IsReturn, string Reason, IReadOnlyList<FulfillmentLine> Lines) : IRequest;
