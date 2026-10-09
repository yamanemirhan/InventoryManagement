using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Products.Codes;
using InventoryManagement.Application.Products.Queries.GetProductById;
using InventoryManagement.Domain.Exceptions;
using InventoryManagement.Domain.Common;
using MediatR;
namespace InventoryManagement.Application.Products.Queries.GetProductByCode;
public sealed class GetProductByCodeQueryHandler(IProductCodeRepository codes, IProductReadRepository products, ICompanyContext company) : IRequestHandler<GetProductByCodeQuery, ProductDto?>
{
    public async Task<ProductDto?> Handle(GetProductByCodeQuery request, CancellationToken ct)
    {
        if (company.CompanyId == Guid.Empty || company.Role is not ("Owner" or "Manager" or "Operator" or "Viewer")) throw new ForbiddenException();
        var code = request.Code.Trim();
        if (code.StartsWith("inventory:", StringComparison.OrdinalIgnoreCase))
        {
            var parts = code.Split(':');
            if (parts.Length != 5 || parts[0] != "inventory" || parts[1] != "v1" || parts[3] != "product"
                || !Guid.TryParseExact(parts[2], "D", out var owner) || !Guid.TryParseExact(parts[4], "D", out var productId)) throw new DomainException("Invalid inventory QR label.");
            if (owner != company.CompanyId) throw new DomainException("This label belongs to another company. Select the correct company first.");
            return await products.GetByIdAsync(productId, ct);
        }
        var matches = await codes.FindAsync(BarcodeRules.Variants(code), ct);
        if (matches.Count > 1) throw new InvalidOperationException("This code matches multiple products. Use the company QR label or correct the duplicate SKU/barcode.");
        return matches.SingleOrDefault();
    }
}
