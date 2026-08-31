
using FluentValidation.TestHelper;
using InventoryManagement.Application.Products.Commands.CreateProduct;

namespace InventoryManagement.UnitTests.Application.Products;

public class CreateProductCommandValidatorTests
{
    private readonly CreateProductCommandValidator _validator = new();

    [Fact]
    public async Task Validate_WhenNameIsEmpty_ShouldHaveError()
    {
        var command = new CreateProductCommand("", "KB-001");

        var result = await _validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public async Task Validate_WhenSkuIsEmpty_ShouldHaveError()
    {
        var command = new CreateProductCommand("Keyboard", "");

        var result = await _validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(x => x.Sku);
    }

    [Fact]
    public async Task Validate_WhenCommandIsValid_ShouldNotHaveErrors()
    {
        var command = new CreateProductCommand("Keyboard", "KB-001");

        var result = await _validator.TestValidateAsync(command);

        result.ShouldNotHaveAnyValidationErrors();
    }
}