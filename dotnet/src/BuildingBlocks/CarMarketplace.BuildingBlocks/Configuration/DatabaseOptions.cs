namespace CarMarketplace.BuildingBlocks.Configuration;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 5432;
    public string User { get; set; } = "car";
    public string Password { get; set; } = "car";
    public string Name { get; set; } = "car_marketplace";
}
