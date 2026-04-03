using Asp.Versioning;
using CarMarketplace.BuildingBlocks.Configuration;
using CarMarketplace.Modules.Admin;
using CarMarketplace.Modules.Auth;
using CarMarketplace.Modules.Listings;
using CarMarketplace.Modules.Notifications;
using CarMarketplace.Modules.Payments;
using CarMarketplace.Modules.Search;
using CarMarketplace.Modules.Users;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) => cfg.ReadFrom.Configuration(ctx.Configuration));

builder.Configuration.AddEnvironmentVariables();

var dbOptions = new DatabaseOptions
{
    Host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost",
    Port = int.TryParse(Environment.GetEnvironmentVariable("POSTGRES_PORT"), out var port) ? port : 5432,
    User = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "car",
    Password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "car",
    Name = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "car_marketplace"
};
builder.Services.Configure<DatabaseOptions>(options =>
{
    options.Host = dbOptions.Host;
    options.Port = dbOptions.Port;
    options.User = dbOptions.User;
    options.Password = dbOptions.Password;
    options.Name = dbOptions.Name;
});

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthModule();
builder.Services.AddUsersModule();
builder.Services.AddListingsModule(builder.Configuration);
builder.Services.AddPaymentsModule();
builder.Services.AddNotificationsModule();
builder.Services.AddAdminModule();
builder.Services.AddSearchModule();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
