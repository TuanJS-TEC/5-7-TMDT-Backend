using Microsoft.Extensions.DependencyInjection;

namespace CarMarketplace.Modules.Payments;

public static class PaymentsModuleRegistration
{
    public static IServiceCollection AddPaymentsModule(this IServiceCollection services)
    {
        services.AddSingleton<PaymentsService>();
        return services;
    }
}

public sealed class PaymentsService
{
    public string Health() => "Payments module ready";
}
