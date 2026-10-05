Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\branding\logo san juan 2.png"
$iconsDir = Join-Path $PSScriptRoot "..\public\icons"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

$srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))

function Create-PwaIcon {
    param (
        [int]$size,
        [string]$outPath,
        [double]$scale = 0.85,
        [string]$bgColor = $null
    )

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($bgColor) {
        $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($bgColor))
        $g.FillRectangle($brush, 0, 0, $size, $size)
        $brush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $destW = [int]($size * $scale)
    $destH = [int](($destW / $srcImg.Width) * $srcImg.Height)
    if ($destH -gt ($size * $scale)) {
        $destH = [int]($size * $scale)
        $destW = [int](($destH / $srcImg.Height) * $srcImg.Width)
    }

    $destX = [int](($size - $destW) / 2)
    $destY = [int](($size - $destH) / 2)

    $g.DrawImage($srcImg, $destX, $destY, $destW, $destH)
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Created: $outPath ($size x $size)"
}

# Standard transparent icons
Create-PwaIcon -size 192 -outPath (Join-Path $iconsDir "icon-192.png") -scale 0.90
Create-PwaIcon -size 512 -outPath (Join-Path $iconsDir "icon-512.png") -scale 0.90

# Maskable icons with solid brand background (Navy #0f172a) and 70% scale (safe zone)
Create-PwaIcon -size 192 -outPath (Join-Path $iconsDir "icon-maskable-192.png") -scale 0.70 -bgColor "#0f172a"
Create-PwaIcon -size 512 -outPath (Join-Path $iconsDir "icon-maskable-512.png") -scale 0.70 -bgColor "#0f172a"

# Apple touch icon 180x180
Create-PwaIcon -size 180 -outPath (Join-Path $iconsDir "apple-touch-icon.png") -scale 0.75 -bgColor "#0f172a"

# Also place apple-touch-icon in public/apple-touch-icon.png
Create-PwaIcon -size 180 -outPath (Join-Path $PSScriptRoot "..\public\apple-touch-icon.png") -scale 0.75 -bgColor "#0f172a"

$srcImg.Dispose()
Write-Output "All icons generated successfully!"
