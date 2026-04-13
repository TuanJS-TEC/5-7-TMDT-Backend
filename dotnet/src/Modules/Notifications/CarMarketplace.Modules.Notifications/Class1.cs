using Microsoft.Extensions.DependencyInjection;

namespace CarMarketplace.Modules.Notifications;

public static class NotificationsModuleRegistration
{
    public static IServiceCollection AddNotificationsModule(this IServiceCollection services)
    {
        services.AddSingleton<NotificationsService>();
        return services;
    }
}

public sealed class NotificationsService
{
    public string Health() => "Notifications module ready";
}
