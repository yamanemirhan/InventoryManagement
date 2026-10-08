using FluentValidation;
namespace InventoryManagement.Application.Assistant.Commands.SendAssistantMessage;
public sealed class SendAssistantMessageCommandValidator : AbstractValidator<SendAssistantMessageCommand>
{
    public SendAssistantMessageCommandValidator()
    {
        RuleFor(x => x.Locale).Must(x => x is "tr" or "en").WithMessage("Choose Turkish or English.");
        RuleFor(x => x.Page).Must(x => x is "overview" or "products" or "warehouses" or "stocks" or "stock-receipt"
            or "stock-transfer" or "suppliers" or "purchases" or "reports" or "imports" or "scan" or "companies" or "knowledge" or "other")
            .WithMessage("Invalid assistant page context.");
        RuleFor(x => x.ExternalProcessingAccepted).Equal(true).WithMessage("Accept external AI processing before sending.");
        RuleFor(x => x.Messages).Custom((messages, context) =>
        {
            if (messages is null || messages.Count is < 1 or > 11 || messages.Count % 2 != 1)
            { context.AddFailure("Use 1-11 alternating messages ending with a user message."); return; }
            var total = 0;
            for (var i = 0; i < messages.Count; i++)
            {
                var message = messages[i];
                if (message is null || message.Role != (i % 2 == 0 ? "user" : "assistant") || string.IsNullOrWhiteSpace(message.Text)
                    || message.Text.Length > (i % 2 == 0 ? 2000 : 12000))
                { context.AddFailure($"Invalid message at position {i + 1}."); continue; }
                total += message.Text.Length;
            }
            if (total > 20000) context.AddFailure("Conversation is too long. Start a new chat.");
        });
    }
}
