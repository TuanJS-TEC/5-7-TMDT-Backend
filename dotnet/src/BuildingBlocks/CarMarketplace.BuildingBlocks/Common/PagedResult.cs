namespace CarMarketplace.BuildingBlocks.Common;

public sealed record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int Total,
    int Page,
    int Limit
);
