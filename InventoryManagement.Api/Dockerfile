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
COPY ["InventoryManagement.Api/", "InventoryManagement.Api/"]
COPY ["InventoryManagement.Application/", "InventoryManagement.Application/"]
COPY ["InventoryManagement.Domain/", "InventoryManagement.Domain/"]
COPY ["InventoryManagement.Infrastructure/", "InventoryManagement.Infrastructure/"]
RUN dotnet publish "InventoryManagement.Api/InventoryManagement.Api.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=publish /app/publish .

# Official .NET Linux images include the non-root app user.
USER $APP_UID

ENTRYPOINT ["dotnet", "InventoryManagement.Api.dll"]
