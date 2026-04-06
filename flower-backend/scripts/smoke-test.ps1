param(
  [string]$BaseUrl = "http://localhost:3000/api"
)

$ErrorActionPreference = "Stop"

function Invoke-Api {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Url,
    [object]$Body,
    [hashtable]$Headers
  )

  $params = @{
    Method = $Method
    Uri = $Url
    ContentType = "application/json"
  }

  if ($null -ne $Body) {
    $params.Body = ($Body | ConvertTo-Json -Depth 10)
  }

  if ($null -ne $Headers) {
    $params.Headers = $Headers
  }

  return Invoke-RestMethod @params
}

function ConvertTo-BearerHeader {
  param([Parameter(Mandatory = $true)][string]$Token)
  return @{ Authorization = "Bearer $Token" }
}

Write-Host "[1/8] Backend health check..."
try {
  Invoke-RestMethod -Method Get -Uri "$BaseUrl/products" | Out-Null
} catch {
  throw "Backend erişilemiyor: $BaseUrl"
}

$suffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)
$adminEmail = "admin.$suffix@example.com"
$userEmail = "user.$suffix@example.com"
$password = "StrongPass!1234"

Write-Host "[2/8] Register users..."
$adminReg = Invoke-Api -Method Post -Url "$BaseUrl/auth/register" -Body @{
  email = $adminEmail
  password = $password
  name = "Smoke Admin"
}

$userReg = Invoke-Api -Method Post -Url "$BaseUrl/auth/register" -Body @{
  email = $userEmail
  password = $password
  name = "Smoke User"
}

if (-not $adminReg.accessToken -or -not $userReg.accessToken) {
  throw "Register adımı access token dönmedi."
}

Write-Host "[3/8] Promote admin user in DB..."
docker compose exec -T backend node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.update({ where: { email: '$adminEmail' }, data: { role: 'admin' } }).then(() => p.`$disconnect()).catch((e) => { console.error(e); process.exit(1); });" | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Admin role update failed in PostgreSQL."
}

Write-Host "[4/8] Login users and validate refresh rotation..."
$adminLogin = Invoke-Api -Method Post -Url "$BaseUrl/auth/login" -Body @{
  email = $adminEmail
  password = $password
}

$userLogin = Invoke-Api -Method Post -Url "$BaseUrl/auth/login" -Body @{
  email = $userEmail
  password = $password
}

if (-not $adminLogin.refreshToken -or -not $userLogin.accessToken) {
  throw "Login adımı beklenen tokenları döndürmedi."
}

$firstRefresh = Invoke-Api -Method Post -Url "$BaseUrl/auth/refresh" -Body @{
  refreshToken = $adminLogin.refreshToken
}

$reuseBlocked = $false
try {
  Invoke-Api -Method Post -Url "$BaseUrl/auth/refresh" -Body @{
    refreshToken = $adminLogin.refreshToken
  } | Out-Null
} catch {
  $reuseBlocked = $true
}

if (-not $reuseBlocked) {
  throw "Refresh token reuse attack testi başarısız: eski token tekrar kabul edildi."
}

$adminHeaders = ConvertTo-BearerHeader -Token $firstRefresh.accessToken
$userHeaders = ConvertTo-BearerHeader -Token $userLogin.accessToken

Write-Host "[5/8] Admin creates category and product..."
$category = Invoke-Api -Method Post -Url "$BaseUrl/categories" -Headers $adminHeaders -Body @{
  name = "Smoke Category $suffix"
}

$product = Invoke-Api -Method Post -Url "$BaseUrl/products" -Headers $adminHeaders -Body @{
  name = "Smoke Product $suffix"
  description = "Smoke test product"
  price = 199.99
  stock = 20
  images = @("https://example.com/flower.jpg")
  categoryId = $category.id
}

if (-not $product.id) {
  throw "Product create başarısız."
}

Write-Host "[6/8] User address + cart flow..."
$address = Invoke-Api -Method Post -Url "$BaseUrl/address" -Headers $userHeaders -Body @{
  fullName = "Smoke User"
  phone = "+905551234567"
  country = "Turkey"
  city = "Istanbul"
  addressLine = "Street 1"
  postalCode = "34000"
}

Invoke-Api -Method Post -Url "$BaseUrl/cart/add" -Headers $userHeaders -Body @{
  productId = $product.id
  quantity = 2
} | Out-Null

$cart = Invoke-Api -Method Get -Url "$BaseUrl/cart" -Headers $userHeaders
if (-not $cart.items -or $cart.items.Count -lt 1) {
  throw "Cart akışı başarısız."
}

Write-Host "[7/8] User creates order; admin lists entities..."
$order = Invoke-Api -Method Post -Url "$BaseUrl/orders" -Headers $userHeaders -Body @{
  addressId = $address.id
}

if (-not $order.id) {
  throw "Order create başarısız."
}

$adminUsers = Invoke-Api -Method Get -Url "$BaseUrl/admin/users" -Headers $adminHeaders
$adminOrders = Invoke-Api -Method Get -Url "$BaseUrl/admin/orders" -Headers $adminHeaders
$adminProducts = Invoke-Api -Method Get -Url "$BaseUrl/admin/products" -Headers $adminHeaders

Write-Host "[8/8] Logout..."
Invoke-Api -Method Post -Url "$BaseUrl/auth/logout" -Headers $adminHeaders -Body @{
  refreshToken = $firstRefresh.refreshToken
} | Out-Null

[PSCustomObject]@{
  AdminEmail = $adminEmail
  UserEmail = $userEmail
  CategoryId = $category.id
  ProductId = $product.id
  OrderId = $order.id
  AdminUsersCount = @($adminUsers).Count
  AdminOrdersCount = @($adminOrders).Count
  AdminProductsCount = @($adminProducts).Count
  RefreshReuseBlocked = $reuseBlocked
  Result = "PASS"
} | Format-List
