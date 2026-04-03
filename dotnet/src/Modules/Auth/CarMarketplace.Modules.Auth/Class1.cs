using Microsoft.Extensions.DependencyInjection;

namespace CarMarketplace.Modules.Auth;

public static class AuthModuleRegistration
{
    public static IServiceCollection AddAuthModule(this IServiceCollection services)
    {
        services.AddSingleton<AuthService>();
        return services;
    }
}

public sealed class AuthService
{
    public object Login(string username)
    {
        return new
        {
            accessToken = $"dev-token-{username}",
            tokenType = "Bearer",
            expiresIn = 3600
        };
    }

    public string Health() => "Auth module ready";
}
