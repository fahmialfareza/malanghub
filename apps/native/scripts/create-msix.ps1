param(
  [Parameter(Mandatory = $true)]
  [string]$IdentityName,

  [Parameter(Mandatory = $true)]
  [string]$Publisher,

  [Parameter(Mandatory = $true)]
  [string]$PublisherDisplayName,

  [Parameter(Mandatory = $true)]
  [string]$Version,

  [Parameter(Mandatory = $true)]
  [ValidateSet("x64", "arm64")]
  [string]$ProcessorArchitecture,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [string]$SignPfxPath = "",
  [string]$SignPfxPassword = "",
  [string]$TimestampUrl = "http://timestamp.digicert.com"
)

$ErrorActionPreference = "Stop"

if ($Version -notmatch "^\d+\.\d+\.\d+\.\d+$") {
  throw "MSIX version must use four numeric parts, for example 0.1.123.0."
}

$appDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$targetDir = Join-Path $appDir "src-tauri\target"
$exe = Get-ChildItem -Path $targetDir -Recurse -Filter "malanghub-native.exe" |
  Where-Object { $_.FullName -match "\\release\\malanghub-native\.exe$" } |
  Sort-Object FullName -Descending |
  Select-Object -First 1

if (-not $exe) {
  throw "Could not find the Windows release executable. Run tauri build first."
}

$staging = Join-Path $env:RUNNER_TEMP "malanghub-msix"
$assets = Join-Path $staging "Assets"
Remove-Item -Path $staging -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $assets -Force | Out-Null

Copy-Item -Path $exe.FullName -Destination (Join-Path $staging "Malanghub.exe")

function Assert-NativeCommandSucceeded([string]$CommandName) {
  if ($LASTEXITCODE -ne 0) {
    throw "$CommandName failed with exit code $LASTEXITCODE."
  }
}

function New-WideLogo([string]$SourcePath, [string]$OutputPath) {
  Add-Type -AssemblyName System.Drawing

  $source = [System.Drawing.Image]::FromFile($SourcePath)
  $bitmap = New-Object System.Drawing.Bitmap 310, 150
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#111322"))
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $maxWidth = 118
    $maxHeight = 118
    $scale = [Math]::Min($maxWidth / $source.Width, $maxHeight / $source.Height)
    $width = [Math]::Max(1, [Math]::Round($source.Width * $scale))
    $height = [Math]::Max(1, [Math]::Round($source.Height * $scale))
    $x = [Math]::Round((310 - $width) / 2)
    $y = [Math]::Round((150 - $height) / 2)

    $graphics.DrawImage($source, $x, $y, $width, $height)
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
    $source.Dispose()
  }
}

$iconDir = Join-Path $appDir "src-tauri\icons"
$iconNames = @(
  "StoreLogo.png",
  "Square44x44Logo.png",
  "Square150x150Logo.png",
  "Square310x310Logo.png"
)

foreach ($iconName in $iconNames) {
  Copy-Item -Path (Join-Path $iconDir $iconName) -Destination (Join-Path $assets $iconName)
}

New-WideLogo `
  -SourcePath (Join-Path $iconDir "icon.png") `
  -OutputPath (Join-Path $assets "Wide310x150Logo.png")

function Escape-Xml([string]$Value) {
  return [System.Security.SecurityElement]::Escape($Value)
}

$escapedIdentityName = Escape-Xml $IdentityName
$escapedPublisher = Escape-Xml $Publisher
$escapedPublisherDisplayName = Escape-Xml $PublisherDisplayName

$manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:uap10="http://schemas.microsoft.com/appx/manifest/uap/windows10/10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap uap10 rescap">
  <Identity Name="$escapedIdentityName" Publisher="$escapedPublisher" Version="$Version" ProcessorArchitecture="$ProcessorArchitecture" />
  <Properties>
    <DisplayName>Malanghub</DisplayName>
    <PublisherDisplayName>$escapedPublisherDisplayName</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>
  <Resources>
    <Resource Language="id-ID" />
    <Resource Language="en-US" />
  </Resources>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19041.0" MaxVersionTested="10.0.26100.0" />
  </Dependencies>
  <Capabilities>
    <Capability Name="internetClient" />
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
  <Applications>
    <Application Id="Malanghub" Executable="Malanghub.exe" uap10:RuntimeBehavior="packagedClassicApp" uap10:TrustLevel="mediumIL">
      <uap:VisualElements
        DisplayName="Malanghub"
        Description="Malanghub native app"
        BackgroundColor="#111322"
        Square44x44Logo="Assets\Square44x44Logo.png"
        Square150x150Logo="Assets\Square150x150Logo.png">
        <uap:DefaultTile
          Square310x310Logo="Assets\Square310x310Logo.png"
          Wide310x150Logo="Assets\Wide310x150Logo.png" />
      </uap:VisualElements>
    </Application>
  </Applications>
</Package>
"@

Set-Content -Path (Join-Path $staging "AppxManifest.xml") -Value $manifest -Encoding UTF8

$windowsKitBin = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
$makeAppx = Get-ChildItem -Path $windowsKitBin -Recurse -Filter "MakeAppx.exe" |
  Where-Object { $_.FullName -match "\\x64\\MakeAppx\.exe$" } |
  Sort-Object FullName -Descending |
  Select-Object -First 1

if (-not $makeAppx) {
  throw "MakeAppx.exe was not found in the Windows SDK."
}

New-Item -ItemType Directory -Path (Split-Path -Parent $OutputPath) -Force | Out-Null
& $makeAppx.FullName pack /v /o /d $staging /p $OutputPath
Assert-NativeCommandSucceeded "MakeAppx"

if ($SignPfxPath -and (Test-Path $SignPfxPath)) {
  $signtool = Get-ChildItem -Path $windowsKitBin -Recurse -Filter "signtool.exe" |
    Where-Object { $_.FullName -match "\\x64\\signtool\.exe$" } |
    Sort-Object FullName -Descending |
    Select-Object -First 1

  if (-not $signtool) {
    throw "signtool.exe was not found in the Windows SDK."
  }

  & $signtool.FullName sign /fd SHA256 /tr $TimestampUrl /td SHA256 /f $SignPfxPath /p $SignPfxPassword $OutputPath
  Assert-NativeCommandSucceeded "signtool"
}

Write-Host "MSIX created at $OutputPath"
