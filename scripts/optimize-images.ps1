param(
    [Parameter(Mandatory = $true)]
    [string]$Event
)

# Ottimizza foto mirrorless per il web (senza dipendenze esterne).
#
# 1. Copia i JPEG in images/<evento>/original/
# 2. Esegui: .\scripts\optimize-images.ps1 -Event nascita
#
# Output in images/<evento>/thumbs/ e images/<evento>/full/

Add-Type -AssemblyName System.Drawing

$Root = Split-Path $PSScriptRoot -Parent
$InputDir  = Join-Path $Root "images\$Event\original"
$ThumbsDir = Join-Path $Root "images\$Event\thumbs"
$FullDir   = Join-Path $Root "images\$Event\full"

$Extensions = @(".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp")

function Save-Jpeg {
    param(
        [System.Drawing.Image]$Image,
        [string]$Path,
        [long]$Quality
    )
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
        Where-Object { $_.MimeType -eq "image/jpeg" }
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, $Quality
    )
    $Image.Save($Path, $encoder, $params)
    $params.Dispose()
}

function Resize-ImageFile {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$MaxSide,
        [long]$Quality
    )

    $source = [System.Drawing.Image]::FromFile($InputPath)
    try {
        $w = $source.Width
        $h = $source.Height
        $scale = if ($w -le $MaxSide -and $h -le $MaxSide) { 1.0 } else { [Math]::Min($MaxSide / $w, $MaxSide / $h) }
        $nw = [Math]::Max(1, [int][Math]::Round($w * $scale))
        $nh = [Math]::Max(1, [int][Math]::Round($h * $scale))

        $bitmap = New-Object System.Drawing.Bitmap $nw, $nh
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($source, 0, 0, $nw, $nh)
        $graphics.Dispose()

        Save-Jpeg -Image $bitmap -Path $OutputPath -Quality $Quality
        $bitmap.Dispose()

        return (Get-Item $OutputPath).Length
    }
    finally {
        $source.Dispose()
    }
}

if (-not (Test-Path $InputDir)) {
    Write-Error "Cartella non trovata: images\$Event\original\"
    exit 1
}

New-Item -ItemType Directory -Force -Path $ThumbsDir, $FullDir | Out-Null

$files = Get-ChildItem -Path $InputDir -File |
    Where-Object { $Extensions -contains $_.Extension.ToLower() } |
    Sort-Object Name

if (-not $files.Count) {
    Write-Host "Nessuna foto in images/$Event/original/"
    Write-Host "Copia i file dalla mirrorless e rilancia lo script."
    exit 0
}

Write-Host "Evento: $Event - $($files.Count) foto"
Write-Host ""

$items = @()

foreach ($file in $files) {
    $name = [System.IO.Path]::GetFileNameWithoutExtension($file.Name).ToLower() -replace "\s+", "-"
    $inputKB = [Math]::Round($file.Length / 1KB)
    $thumbPath = Join-Path $ThumbsDir "$name.jpg"
    $fullPath  = Join-Path $FullDir "$name.jpg"

    $thumbBytes = Resize-ImageFile -InputPath $file.FullName -OutputPath $thumbPath -MaxSide 720 -Quality 82
    $fullBytes  = Resize-ImageFile -InputPath $file.FullName -OutputPath $fullPath -MaxSide 1600 -Quality 85

    $thumbKB = [Math]::Round($thumbBytes / 1KB)
    $fullKB  = [Math]::Round($fullBytes / 1KB)
    $rel = "images/$Event/full/$name.jpg"

    Write-Host ('- {0} ({1} KB) thumb {2} KB full {3} KB' -f $file.Name, $inputKB, $thumbKB, $fullKB)
    $items += ('"' + $rel + '"')
}

Write-Host ''
Write-Host ('-- Aggiungi in eventi/' + $Event + '.json (items) --')
Write-Host ''
Write-Host '['
foreach ($item in $items) { Write-Host ('    ' + $item + ',') }
Write-Host '  ]'
