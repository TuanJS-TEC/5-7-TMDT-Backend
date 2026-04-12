using Asp.Versioning;
using CarMarketplace.Modules.Admin;
using CarMarketplace.Modules.Auth;
using CarMarketplace.Modules.Notifications;
using CarMarketplace.Modules.Payments;
using CarMarketplace.Modules.Search;
using CarMarketplace.Modules.Users;
using Microsoft.AspNetCore.Mvc;

namespace CarMarketplace.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}")]
public sealed class SystemController : ControllerBase
{
    [HttpGet("health")]
    public IActionResult GetHealth()
    {
        return Ok(new { status = "ok" });
    }

    [HttpGet("auth")]
    public IActionResult Auth([FromServices] AuthService svc) => Ok(new { message = svc.Health() });

    [HttpPost("auth/login")]
    public IActionResult Login([FromServices] AuthService svc, [FromBody] LoginRequest req)
        => Ok(svc.Login(req.Username));

    [HttpGet("users")]
    public IActionResult Users([FromServices] UsersService svc) => Ok(new { message = svc.Health() });

    [HttpGet("payments")]
    public IActionResult Payments([FromServices] PaymentsService svc) => Ok(new { message = svc.Health() });

    [HttpGet("notifications")]
    public IActionResult Notifications([FromServices] NotificationsService svc) => Ok(new { message = svc.Health() });

    [HttpGet("admin")]
    public IActionResult Admin([FromServices] AdminService svc) => Ok(new { message = svc.Health() });

    [HttpGet("search")]
    public IActionResult Search([FromServices] SearchService svc) => Ok(new { message = svc.Health() });
}

public sealed record LoginRequest(string Username);
