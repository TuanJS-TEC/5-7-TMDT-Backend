using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CarMarketplace.Modules.Listings;

public sealed class DesignTimeListingsDbContextFactory : IDesignTimeDbContextFactory<ListingsDbContext>
{
    public ListingsDbContext CreateDbContext(string[] args)
    {
        var host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
        var port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
        var user = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "car";
        var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "car";
        var name = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "car_marketplace";
        var conn = $"Host={host};Port={port};Username={user};Password={password};Database={name}";

        var builder = new DbContextOptionsBuilder<ListingsDbContext>();
        builder.UseNpgsql(conn);
        return new ListingsDbContext(builder.Options);
    }
}
