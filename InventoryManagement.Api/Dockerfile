# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS restore
WORKDIR /src

# Copy project files first so NuGet restore can be cached until dependencies change.
COPY ["InventoryManagement.Api/InventoryManagement.Api.csproj", "InventoryManagement.Api/"]
COPY ["InventoryManagement.Application/InventoryManagement.Application.csproj", "InventoryManagement.Application/"]
COPY ["InventoryManagement.Domain/InventoryManagement.Domain.csproj", "InventoryManagement.Domain/"]
COPY ["InventoryManagement.Infrastructure/InventoryManagement.Infrastructure.csproj", "InventoryManagement.Infrastructure/"]
RUN dotnet restore "InventoryManagement.Api/InventoryManagement.Api.csproj"

FROM restore AS publish
ARG TARGETARCH
COPY ["InventoryManagement.Api/", "InventoryManagement.Api/"]
COPY ["InventoryManagement.Application/", "InventoryManagement.Application/"]
COPY ["InventoryManagement.Domain/", "InventoryManagement.Domain/"]
COPY ["InventoryManagement.Infrastructure/", "InventoryManagement.Infrastructure/"]
RUN dotnet publish "InventoryManagement.Api/InventoryManagement.Api.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

# Build a deployment artifact for explicitly controlled production migrations.
RUN dotnet tool install --tool-path /tools dotnet-ef --version 10.0.11 && \
    ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__DefaultConnection="Host=localhost;Database=inventory_bundle_build;Username=build;Password=build" \
    /tools/dotnet-ef migrations bundle \
        --project "InventoryManagement.Infrastructure/InventoryManagement.Infrastructure.csproj" \
        --startup-project "InventoryManagement.Api/InventoryManagement.Api.csproj" \
        --configuration Release \
        --no-build \
        --target-runtime "linux-$(if [ "$TARGETARCH" = arm64 ]; then echo arm64; else echo x64; fi)" \
        --output /app/publish/efbundle \
        --force

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update && \
    apt-get install --yes --no-install-recommends curl libgssapi-krb5-2 && \
    rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=publish /app/publish .

# Official .NET Linux images include the non-root app user.
USER $APP_UID

ENTRYPOINT ["dotnet", "InventoryManagement.Api.dll"]
