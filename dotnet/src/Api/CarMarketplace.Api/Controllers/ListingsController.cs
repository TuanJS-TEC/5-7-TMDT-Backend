using Asp.Versioning;
using CarMarketplace.Modules.Listings;
using Microsoft.AspNetCore.Mvc;

namespace CarMarketplace.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/listings")]
public sealed class ListingsController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromServices] ListingsService service,
        [FromBody] CreateListingRequest req,
        CancellationToken ct)
    {
        var result = await service.Handle(new CreateListingCommand(
            req.Title,
            req.Description,
            req.PriceVnd,
            req.SellerId
        ), ct);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromServices] ListingsService service,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? status = null,
        CancellationToken ct = default)
    {
        var result = await service.Handle(new GetListingsQuery(page, limit, status), ct);
        return Ok(result);
    }

    [HttpGet("seller/{sellerId:guid}")]
    public async Task<IActionResult> ListBySeller(
        [FromServices] ListingsService service,
        [FromRoute] Guid sellerId,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        var result = await service.Handle(new GetSellerListingsQuery(sellerId, page, limit), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detail(
        [FromServices] ListingsService service,
        [FromRoute] Guid id,
        CancellationToken ct)
    {
        var row = await service.Handle(new GetListingByIdQuery(id), ct);
        return row is null ? NotFound(new { message = "Listing not found" }) : Ok(row);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(
        [FromServices] ListingsService service,
        [FromRoute] Guid id,
        [FromBody] UpdateListingRequest req,
        CancellationToken ct)
    {
        var row = await service.Handle(new UpdateListingCommand(
            id,
            req.SellerId,
            req.Title,
            req.Description,
            req.PriceVnd
        ), ct);
        return row is null ? NotFound(new { message = "Listing not found" }) : Ok(row);
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(
        [FromServices] ListingsService service,
        [FromRoute] Guid id,
        [FromBody] ApproveListingRequest req,
        CancellationToken ct)
    {
        var row = await service.Handle(new ApproveListingCommand(id, req.ModeratorId), ct);
        return row is null ? NotFound(new { message = "Listing not found" }) : Ok(row);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        [FromServices] ListingsService service,
        [FromRoute] Guid id,
        [FromBody] DeleteListingRequest req,
        CancellationToken ct)
    {
        var deleted = await service.Handle(new DeleteListingCommand(id, req.SellerId), ct);
        return deleted ? Ok(new { success = true }) : NotFound(new { message = "Listing not found" });
    }
}

public sealed record CreateListingRequest(string Title, string Description, long PriceVnd, Guid SellerId);
public sealed record UpdateListingRequest(Guid SellerId, string? Title, string? Description, long? PriceVnd);
public sealed record ApproveListingRequest(Guid ModeratorId);
public sealed record DeleteListingRequest(Guid SellerId);
