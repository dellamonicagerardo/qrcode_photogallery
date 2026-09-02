# Rigenera eventi/manifest.json
# Esegui: .\scripts\generate-event-manifest.ps1

$Root = Split-Path $PSScriptRoot -Parent
$EventsDir = Join-Path $Root "eventi"

$files = Get-ChildItem -Path $EventsDir -Filter "*.json" |
    Where-Object { $_.Name -ne "manifest.json" } |
    Sort-Object Name

$events = foreach ($file in $files) {
    $data = Get-Content $file.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
    $id = if ($data.id) { $data.id } else { $file.BaseName }
    $name = if ($data.meta.title) {
        ($data.meta.title -split "—")[0].Trim()
    } else {
        $id
    }
    [PSCustomObject]@{ id = $id; name = $name; file = $file.Name }
}

$defaultEvent = ($events | Where-Object { $_.id -eq "nascita" } | Select-Object -First 1).id
if (-not $defaultEvent) { $defaultEvent = $events[0].id }

$manifest = [ordered]@{
    defaultEvent = $defaultEvent
    events = @($events)
}

$outPath = Join-Path $EventsDir "manifest.json"
$manifest | ConvertTo-Json -Depth 5 | Set-Content $outPath -Encoding UTF8

$ids = ($events | ForEach-Object { $_.id }) -join ", "
Write-Host "manifest.json aggiornato ($($events.Count) eventi): $ids"
