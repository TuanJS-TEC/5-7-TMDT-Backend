using Microsoft.Extensions.DependencyInjection;

namespace CarMarketplace.Modules.Users;

public static class UsersModuleRegistration
{
    public static IServiceCollection AddUsersModule(this IServiceCollection services)
    {
        services.AddSingleton<UsersService>();
        return services;
    }
}

public sealed class UsersService
{
    public string Health() => "Users module ready";
}
