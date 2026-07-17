# Converte um PNG em um .ico multi-resolucao (entradas PNG, estilo Vista+).
# Uso: powershell -ExecutionPolicy Bypass -File png-to-ico.ps1 -In logo.png -Out saida.ico
param(
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][string]$Out
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$inPath = (Resolve-Path $In).Path
$src = [System.Drawing.Image]::FromFile($inPath)
try {
  $sizes = @(16, 24, 32, 48, 64, 128, 256)
  $pngs = @()
  foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($s, $s)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $s, $s)
    $g.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngs += , ($ms.ToArray())
    $ms.Dispose()
    $bmp.Dispose()
  }
}
finally { $src.Dispose() }

$bw = New-Object System.IO.BinaryWriter([System.IO.File]::Open($Out, [System.IO.FileMode]::Create))
try {
  $bw.Write([UInt16]0)              # reserved
  $bw.Write([UInt16]1)              # type = icon
  $bw.Write([UInt16]$sizes.Count)   # count
  $offset = 6 + (16 * $sizes.Count)
  for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]
    $data = $pngs[$i]
    if ($s -ge 256) { $dim = [Byte]0 } else { $dim = [Byte]$s }
    $bw.Write($dim)                 # width
    $bw.Write($dim)                 # height
    $bw.Write([Byte]0)             # color count
    $bw.Write([Byte]0)             # reserved
    $bw.Write([UInt16]1)           # planes
    $bw.Write([UInt16]32)          # bit count
    $bw.Write([UInt32]$data.Length)
    $bw.Write([UInt32]$offset)
    $offset += $data.Length
  }
  foreach ($data in $pngs) { $bw.Write($data) }
}
finally { $bw.Dispose() }

Write-Host "ICO gerado: $Out"
