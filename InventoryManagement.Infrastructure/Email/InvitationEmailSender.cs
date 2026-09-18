using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Text;
using InventoryManagement.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
namespace InventoryManagement.Infrastructure.Email;

public sealed class InvitationEmailSender(IConfiguration config) : IInvitationEmailSender
{
    private string Read(string key) { var encoded = config["Mail:" + key + "Base64"]; return string.IsNullOrEmpty(encoded) ? config["Mail:" + key] ?? "" : Encoding.UTF8.GetString(Convert.FromBase64String(encoded)); }
    public async Task SendAsync(InvitationDelivery delivery, CancellationToken ct)
    {
        var host = Read("Host"); var origin = config["Mail:AppOrigin"];
        if (string.IsNullOrEmpty(host) || !Uri.TryCreate(origin, UriKind.Absolute, out var uri) || uri.Scheme != "https") throw new InvalidOperationException("Invitation email is not configured.");
        using var smtp = new SmtpClient();
        using var message = new MimeMessage()
        {
            Subject = "Inventory: şirket daveti / company invitation",
            Body = new TextPart("plain")
            {
                Text = $"{delivery.CompanyName} şirketine davet edildiniz. / You have been invited to {delivery.CompanyName}.\n\n" +
              $"Davet edilen e-postayla giriş yapıp Şirket ve ekip ekranından kabul edin. / Sign in with the invited email and accept under Company & team.\n{uri.GetLeftPart(UriPartial.Authority)}/companies\n\nDavet 7 gün geçerlidir. / Invitation expires after 7 days."
            }
        };
        message.From.Add(MailboxAddress.Parse(Read("From")));
        message.To.Add(MailboxAddress.Parse(delivery.Email));
        await smtp.ConnectAsync(host, int.TryParse(Read("Port"), out var port) ? port : 587,
          string.Equals(Read("ImplicitTls"), "true", StringComparison.OrdinalIgnoreCase) ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls, ct);
        await smtp.AuthenticateAsync(Read("Username"), Read("Password"), ct);
        await smtp.SendAsync(message, ct);
        await smtp.DisconnectAsync(true, ct);
    }
}
