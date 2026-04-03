using Microsoft.Extensions.DependencyInjection;

namespace CarMarketplace.Modules.Admin;

public static class AdminModuleRegistration
{
    public static IServiceCollection AddAdminModule(this IServiceCollection services)
    {
        services.AddSingleton<AdminService>();
        return services;
    }
}

public sealed class AdminService
{
    public string Health() => "Admin module ready";
}
