using Microsoft.Extensions.DependencyInjection;

namespace CarMarketplace.Modules.Search;

public static class SearchModuleRegistration
{
    public static IServiceCollection AddSearchModule(this IServiceCollection services)
    {
        services.AddSingleton<SearchService>();
        return services;
    }
}

public sealed class SearchService
{
    public string Health() => "Search module ready";
}
