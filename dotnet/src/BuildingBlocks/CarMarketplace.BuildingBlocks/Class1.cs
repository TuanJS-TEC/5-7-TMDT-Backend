namespace CarMarketplace.BuildingBlocks.Common;

public abstract class EntityBase
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; protected set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; protected set; } = DateTime.UtcNow;

    public void Touch()
    {
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
