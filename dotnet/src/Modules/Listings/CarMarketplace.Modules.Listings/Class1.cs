using CarMarketplace.BuildingBlocks.Common;
using CarMarketplace.BuildingBlocks.Configuration;
using CarMarketplace.BuildingBlocks.Exceptions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarMarketplace.Modules.Listings;

public static class ListingsModuleRegistration
{
    public static IServiceCollection AddListingsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ListingsDbContext>(options =>
        {
            var db = configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>() ?? new DatabaseOptions();
            var conn = $"Host={db.Host};Port={db.Port};Username={db.User};Password={db.Password};Database={db.Name}";
            options.UseNpgsql(conn);
        });

        services.AddScoped<ListingsService>();
        return services;
    }
}

public sealed class ListingsDbContext(DbContextOptions<ListingsDbContext> options) : DbContext(options)
{
    public DbSet<Listing> Listings => Set<Listing>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Listing>(entity =>
        {
            entity.ToTable("listings");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).IsRequired();
            entity.Property(x => x.PriceVnd).HasColumnType("bigint").IsRequired();
            entity.Property(x => x.SellerId).HasColumnType("uuid").IsRequired();
            entity.Property(x => x.Status).HasMaxLength(32).IsRequired();
            entity.Property(x => x.ApprovedAtUtc).HasColumnName("approved_at").HasColumnType("timestamptz");
            entity.Property(x => x.CreatedAtUtc).HasColumnName("created_at").HasColumnType("timestamptz");
            entity.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at").HasColumnType("timestamptz");
        });
    }
}

public sealed class Listing : EntityBase
{
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public long PriceVnd { get; private set; }
    public Guid SellerId { get; private set; }
    public string Status { get; private set; } = "pending";
    public DateTime? ApprovedAtUtc { get; private set; }

    public static Listing Create(string title, string description, long priceVnd, Guid sellerId)
    {
        return new Listing
        {
            Title = title,
            Description = description,
            PriceVnd = priceVnd,
            SellerId = sellerId,
            Status = "pending"
        };
    }

    public void Update(Guid sellerId, string? title, string? description, long? priceVnd)
    {
        if (SellerId != sellerId)
        {
            throw new DomainException("Only seller can update listing");
        }

        if (!string.IsNullOrWhiteSpace(title)) Title = title;
        if (!string.IsNullOrWhiteSpace(description)) Description = description;
        if (priceVnd.HasValue) PriceVnd = priceVnd.Value;
        Touch();
    }

    public void Approve()
    {
        Status = "approved";
        ApprovedAtUtc = DateTime.UtcNow;
        Touch();
    }
}

public sealed record ListingResponse(
    Guid Id,
    string Title,
    string Description,
    long PriceVnd,
    Guid SellerId,
    string Status,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    DateTime? ApprovedAtUtc
);

public sealed record CreateListingCommand(string Title, string Description, long PriceVnd, Guid SellerId);
public sealed record UpdateListingCommand(Guid Id, Guid SellerId, string? Title, string? Description, long? PriceVnd);
public sealed record ApproveListingCommand(Guid Id, Guid ModeratorId);
public sealed record DeleteListingCommand(Guid Id, Guid SellerId);
public sealed record GetListingByIdQuery(Guid Id);
public sealed record GetListingsQuery(int Page, int Limit, string? Status);
public sealed record GetSellerListingsQuery(Guid SellerId, int Page, int Limit);

public sealed class CreateListingCommandValidator : AbstractValidator<CreateListingCommand>
{
    public CreateListingCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.PriceVnd).GreaterThan(0);
        RuleFor(x => x.SellerId).NotEmpty();
    }
}

public sealed class ListingsService(ListingsDbContext dbContext)
{
    public async Task<ListingResponse> Handle(CreateListingCommand command, CancellationToken ct = default)
    {
        await new CreateListingCommandValidator().ValidateAndThrowAsync(command, ct);
        var listing = Listing.Create(command.Title, command.Description, command.PriceVnd, command.SellerId);
        dbContext.Listings.Add(listing);
        await dbContext.SaveChangesAsync(ct);
        return ToResponse(listing);
    }

    public async Task<ListingResponse?> Handle(GetListingByIdQuery query, CancellationToken ct = default)
    {
        var listing = await dbContext.Listings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == query.Id, ct);
        return listing is null ? null : ToResponse(listing);
    }

    public async Task<PagedResult<ListingResponse>> Handle(GetListingsQuery query, CancellationToken ct = default)
    {
        var q = dbContext.Listings.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            q = q.Where(x => x.Status == query.Status);
        }

        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(x => x.CreatedAtUtc)
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(x => ToResponse(x))
            .ToListAsync(ct);

        return new PagedResult<ListingResponse>(items, total, query.Page, query.Limit);
    }

    public async Task<PagedResult<ListingResponse>> Handle(GetSellerListingsQuery query, CancellationToken ct = default)
    {
        var q = dbContext.Listings.AsNoTracking().Where(x => x.SellerId == query.SellerId);
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(x => x.CreatedAtUtc)
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(x => ToResponse(x))
            .ToListAsync(ct);

        return new PagedResult<ListingResponse>(items, total, query.Page, query.Limit);
    }

    public async Task<ListingResponse?> Handle(UpdateListingCommand command, CancellationToken ct = default)
    {
        var listing = await dbContext.Listings.FirstOrDefaultAsync(x => x.Id == command.Id, ct);
        if (listing is null)
        {
            return null;
        }

        listing.Update(command.SellerId, command.Title, command.Description, command.PriceVnd);
        await dbContext.SaveChangesAsync(ct);
        return ToResponse(listing);
    }

    public async Task<ListingResponse?> Handle(ApproveListingCommand command, CancellationToken ct = default)
    {
        var listing = await dbContext.Listings.FirstOrDefaultAsync(x => x.Id == command.Id, ct);
        if (listing is null)
        {
            return null;
        }

        listing.Approve();
        await dbContext.SaveChangesAsync(ct);
        return ToResponse(listing);
    }

    public async Task<bool> Handle(DeleteListingCommand command, CancellationToken ct = default)
    {
        var listing = await dbContext.Listings.FirstOrDefaultAsync(x => x.Id == command.Id, ct);
        if (listing is null)
        {
            return false;
        }

        if (listing.SellerId != command.SellerId)
        {
            throw new DomainException("Only seller can delete listing");
        }

        dbContext.Listings.Remove(listing);
        await dbContext.SaveChangesAsync(ct);
        return true;
    }

    private static ListingResponse ToResponse(Listing listing)
    {
        return new ListingResponse(
            listing.Id,
            listing.Title,
            listing.Description,
            listing.PriceVnd,
            listing.SellerId,
            listing.Status,
            listing.CreatedAtUtc,
            listing.UpdatedAtUtc,
            listing.ApprovedAtUtc
        );
    }
}
