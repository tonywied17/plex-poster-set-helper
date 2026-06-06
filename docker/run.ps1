# Plex Poster Helper - one-command GUI launcher (Windows / PowerShell).
#
#   ./docker/run.ps1            build (if needed) + start the GUI on :3939
#   ./docker/run.ps1 -Build     force a rebuild first
#   ./docker/run.ps1 -Stop      stop & remove the container (config is kept)
#   ./docker/run.ps1 -Port 8095 use a different host port
#
param(
  [switch]$Build,
  [switch]$Stop,
  [int]$Port = 3939
)

$ErrorActionPreference = 'Stop'
$name  = 'plex-poster-helper'
$image = 'plex-poster-helper:gui'
$root  = Split-Path $PSScriptRoot -Parent

if ($Stop) {
  docker rm -f $name 2>$null | Out-Null
  Write-Host "Stopped and removed '$name'. Your config volume 'ppsh-config' is preserved." -ForegroundColor Yellow
  return
}

# Build if the image is missing or -Build was passed
$exists = docker images -q $image
if ($Build -or -not $exists) {
  Write-Host "Building $image (first build takes a few minutes)…" -ForegroundColor Cyan
  docker build -f "$PSScriptRoot/Dockerfile" -t $image $root
}

docker volume create ppsh-config | Out-Null
docker rm -f $name 2>$null | Out-Null

docker run -d --name $name `
  -p "${Port}:3000" `
  -e PUID=1000 -e PGID=1000 -e TZ=(Get-TimeZone).Id `
  -v ppsh-config:/config `
  --shm-size=1g `
  --restart unless-stopped `
  $image | Out-Null

Write-Host "`n✓ Plex Poster Helper is running." -ForegroundColor Green
Write-Host "  Open: http://localhost:$Port" -ForegroundColor Green
Write-Host "  Logs: docker logs -f $name"
Write-Host "  Stop: ./docker/run.ps1 -Stop"
