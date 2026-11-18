$Focused = $true
$ReuseCapture = $false
$ReuseRegions = @()
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Foundation, ContentType = WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.IsGenericMethod -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Await-Operation($Operation, [Type]$ResultType) {
    $task = $asTask.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
    $task.GetAwaiter().GetResult()
}
function Write-Result($Value) { [Console]::WriteLine(($Value | ConvertTo-Json -Compress -Depth 12)) }

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class HextechWindow {
    [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] public struct Point { public int X, Y; }
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
    [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hWnd, out Rect rect);
    [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr hWnd, ref Point point);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);
    public static byte[] TitleSignature(System.Drawing.Bitmap source, System.Drawing.Rectangle region) {
        using (var tile = new System.Drawing.Bitmap(128, 24, System.Drawing.Imaging.PixelFormat.Format32bppArgb)) {
            using (var graphics = System.Drawing.Graphics.FromImage(tile)) {
                graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.Bilinear;
                graphics.DrawImage(source, new System.Drawing.Rectangle(0, 0, 128, 24), region, System.Drawing.GraphicsUnit.Pixel);
            }
            var locked = tile.LockBits(new System.Drawing.Rectangle(0, 0, 128, 24), System.Drawing.Imaging.ImageLockMode.ReadOnly, System.Drawing.Imaging.PixelFormat.Format32bppArgb);
            try {
                var pixels = new byte[128 * 24 * 4];
                Marshal.Copy(locked.Scan0, pixels, 0, pixels.Length);
                var signature = new byte[128 * 24];
                for (int index = 0; index < signature.Length; index++) {
                    int offset = index * 4;
                    signature[index] = (byte)(((pixels[offset] * 29 + pixels[offset + 1] * 150 + pixels[offset + 2] * 77) >> 8) >> 3);
                }
                return signature;
            } finally { tile.UnlockBits(locked); }
        }
    }
}
'@ -ReferencedAssemblies ([System.Drawing.Bitmap].Assembly.Location)

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $engine) { Write-Result @{ type = 'error'; message = 'No Windows OCR language model is installed' }; exit 2 }
Write-Result @{ type = 'ready' }

function Get-TitleSignature($Bitmap, $Regions) {
    $bytes = New-Object System.IO.MemoryStream
    $hash = [System.Security.Cryptography.SHA256]::Create()
    try {
        foreach ($region in $Regions) {
            $x = [Math]::Max(0, [int][Math]::Floor($region.x))
            $y = [Math]::Max(0, [int][Math]::Floor($region.y))
            $width = [Math]::Min([int][Math]::Ceiling($region.width), $Bitmap.Width - $x)
            $height = [Math]::Min([int][Math]::Ceiling($region.height), $Bitmap.Height - $y)
            if ($width -le 0 -or $height -le 0) { return $null }
            $rect = New-Object System.Drawing.Rectangle($x, $y, $width, $height)
            $buffer = [HextechWindow]::TitleSignature($Bitmap, $rect)
            $bytes.Write($buffer, 0, $buffer.Length)
        }
        [Convert]::ToBase64String($hash.ComputeHash($bytes.ToArray()))
    } finally { $hash.Dispose(); $bytes.Dispose() }
}

function Get-VisibleCardCount($Bitmap, $Regions, $Window, $CaptureLeft, $CaptureTop) {
    $visible = 0
    foreach ($region in $Regions) {
        $hits = 0
        foreach ($offsetY in @(0.13, 0.16)) {
            foreach ($offsetX in @(-0.06, -0.03, 0, 0.03, 0.06)) {
                $x = [int]($region.x + $region.width / 2 + $Window.height * $offsetX) - $CaptureLeft
                $y = [int]($region.y + $region.height + $Window.height * $offsetY) - $CaptureTop
                if ($x -lt 0 -or $y -lt 0 -or $x -ge $Bitmap.Width -or $y -ge $Bitmap.Height) { continue }
                $pixel = $Bitmap.GetPixel($x, $y)
                if ($pixel.R -le 16 -and $pixel.G -ge 7 -and $pixel.G -le 38 -and $pixel.B -ge 7 -and $pixel.B -le 42 -and [Math]::Abs([int]$pixel.G - $pixel.B) -le 10 -and $pixel.G -gt $pixel.R + 3) { $hits += 1 }
            }
        }
        if ($hits -ge 6) { $visible += 1 }
    }
    $visible
}

function Recognize-Frame {
    $bitmap = $null; $graphics = $null; $software = $null; $locked = $null
    $startedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    try {
        $cachedCapture = $script:lastCapture
        if ($ReuseCapture -and $cachedCapture -and $startedAt - $cachedCapture.capturedAt -lt 3000) {
            $bitmap = $cachedCapture.bitmap.Clone()
            $window = $cachedCapture.window
            $startedAt = $cachedCapture.capturedAt
        } else {
            $handle = [HextechWindow]::GetForegroundWindow()
            $processNumber = [uint32]0
            $null = [HextechWindow]::GetWindowThreadProcessId($handle, [ref]$processNumber)
            $process = Get-Process -Id $processNumber -ErrorAction SilentlyContinue
            if (-not $process -or $process.ProcessName -ne 'League of Legends' -or [HextechWindow]::IsIconic($handle)) {
                if ($script:lastCapture) { $script:lastCapture.bitmap.Dispose(); $script:lastCapture = $null }
                $script:bodyKey = $null
                $script:lastRecognition = $null
                Write-Result @{ type = 'hidden'; capturedAt = $startedAt }
                return
            }
            $previousContext = [HextechWindow]::SetThreadDpiAwarenessContext([IntPtr](-4))
            try {
                $rect = New-Object HextechWindow+Rect
                $point = New-Object HextechWindow+Point
                if (-not [HextechWindow]::GetClientRect($handle, [ref]$rect) -or -not [HextechWindow]::ClientToScreen($handle, [ref]$point)) { throw 'Cannot locate the game client area' }
                $width = $rect.Right - $rect.Left; $height = $rect.Bottom - $rect.Top
                if ($width -lt 640 -or $height -lt 360) { Write-Result @{ type = 'hidden'; capturedAt = $startedAt }; return }
                $window = [ordered]@{ id = $handle.ToInt64().ToString(); x = $point.X; y = $point.Y; width = $width; height = $height }
                $captureLeft = [int]($width * 0.1); $captureTop = [int]($height * 0.12)
                $bitmap = New-Object System.Drawing.Bitmap([int]($width * 0.8), [int]($height * 0.66), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
                $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
                $graphics.CopyFromScreen($point.X + $captureLeft, $point.Y + $captureTop, 0, 0, $bitmap.Size, [System.Drawing.CopyPixelOperation]::SourceCopy)
                $graphics.Dispose(); $graphics = $null
            } finally { if ($previousContext -ne [IntPtr]::Zero) { $null = [HextechWindow]::SetThreadDpiAwarenessContext($previousContext) } }
            if ($script:lastCapture) { $script:lastCapture.bitmap.Dispose() }
            $script:lastCapture = @{ bitmap = $bitmap.Clone(); window = $window; capturedAt = $startedAt }
        }
        $width = $window.width; $height = $window.height
        $captureLeft = [int]($width * 0.1); $captureTop = [int]($height * 0.12)
        $signature = $null; $cacheKey = $null
        if ($Focused -and @($ReuseRegions).Count -eq 3) {
            $cacheKey = ($window | ConvertTo-Json -Compress) + ($ReuseRegions | ConvertTo-Json -Compress)
            $visibleCards = Get-VisibleCardCount $bitmap $ReuseRegions $window $captureLeft $captureTop
            if ($visibleCards -ge 2) { $script:bodyKey = $cacheKey }
            elseif ($visibleCards -eq 0 -and $script:bodyKey -eq $cacheKey) {
                $script:lastRecognition = $null
                Write-Result @{ type = 'absent'; capturedAt = $startedAt }
                return
            }
            $imageRegions = @($ReuseRegions | ForEach-Object { @{ x = $_.x - $captureLeft; y = $_.y - $captureTop; width = $_.width; height = $_.height } })
            $signature = Get-TitleSignature $bitmap $imageRegions
            $cached = $script:lastRecognition
            if ($signature -and $cached -and $cached.key -eq $cacheKey -and $cached.signature -eq $signature -and $startedAt - $cached.readAt -lt 10000) {
                Write-Result @{ type = 'frame'; capturedAt = $startedAt; elapsedMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() - $startedAt; window = $window; lines = $cached.lines; focused = $true; reused = $true }
                return
            }
        }
        if (@($ReuseRegions).Count -ne 3) { $script:bodyKey = $null }
        $cropLeft = $captureLeft; $cropTop = $captureTop
        if ($Focused) {
            $cropTop = [int]($height * 0.33)
            $region = New-Object System.Drawing.Rectangle(0, ($cropTop - $captureTop), $bitmap.Width, [int]($height * 0.19))
            $cropped = $bitmap.Clone($region, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $bitmap.Dispose(); $bitmap = $cropped
            $scale = [Math]::Min([Math]::Max(0.75, [Math]::Min(2.0, 308.0 / $bitmap.Height)), [Windows.Media.Ocr.OcrEngine]::MaxImageDimension / [double]$bitmap.Width)
        } else {
            $scale = 1.0
            while ([Math]::Max($bitmap.Width, $bitmap.Height) * $scale -gt [Windows.Media.Ocr.OcrEngine]::MaxImageDimension) { $scale /= 2 }
        }
        if ($scale -ne 1) {
            $scaled = New-Object System.Drawing.Bitmap([int]($bitmap.Width * $scale), [int]($bitmap.Height * $scale), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $graphics = [System.Drawing.Graphics]::FromImage($scaled)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::Bilinear
            $graphics.DrawImage($bitmap, 0, 0, $scaled.Width, $scaled.Height)
            $graphics.Dispose(); $graphics = $null
            $bitmap.Dispose(); $bitmap = $scaled
        }
        $bitmapRect = New-Object System.Drawing.Rectangle(0, 0, $bitmap.Width, $bitmap.Height)
        $locked = $bitmap.LockBits($bitmapRect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $rowBytes = $bitmap.Width * 4
        $pixels = New-Object byte[] ($rowBytes * $bitmap.Height)
        if ($locked.Stride -eq $rowBytes) {
            [System.Runtime.InteropServices.Marshal]::Copy($locked.Scan0, $pixels, 0, $pixels.Length)
        } else {
            for ($row = 0; $row -lt $bitmap.Height; $row++) {
                [System.Runtime.InteropServices.Marshal]::Copy([IntPtr]::Add($locked.Scan0, $row * $locked.Stride), $pixels, $row * $rowBytes, $rowBytes)
            }
        }
        $bitmap.UnlockBits($locked); $locked = $null
        $buffer = [System.Runtime.InteropServices.WindowsRuntime.WindowsRuntimeBufferExtensions]::AsBuffer($pixels)
        $software = [Windows.Graphics.Imaging.SoftwareBitmap]::CreateCopyFromBuffer($buffer, [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8, $bitmap.Width, $bitmap.Height, [Windows.Graphics.Imaging.BitmapAlphaMode]::Ignore)
        $result = Await-Operation ($engine.RecognizeAsync($software)) ([Windows.Media.Ocr.OcrResult])
        $lines = @($result.Lines | ForEach-Object {
            @{ words = @($_.Words | ForEach-Object {
                @{ text = $_.Text; x = $_.BoundingRect.X / $scale + $cropLeft; y = $_.BoundingRect.Y / $scale + $cropTop; width = $_.BoundingRect.Width / $scale; height = $_.BoundingRect.Height / $scale }
            }) }
        })
        $script:lastRecognition = if ($signature) { @{ key = $cacheKey; signature = $signature; readAt = $startedAt; lines = $lines } } else { $null }
        Write-Result @{ type = 'frame'; capturedAt = $startedAt; elapsedMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() - $startedAt; window = $window; lines = $lines; focused = $Focused; reused = $false }
    } catch { Write-Result @{ type = 'error'; message = $_.Exception.Message; capturedAt = $startedAt } }
    finally {
        if ($locked -and $bitmap) { $bitmap.UnlockBits($locked) }
        foreach ($resource in @($software, $graphics, $bitmap)) { if ($null -ne $resource) { $resource.Dispose() } }
    }
}

try {
    while ($null -ne ($line = [Console]::ReadLine())) {
        try {
            $command = $line | ConvertFrom-Json
            if ($command.type -eq 'capture') {
                $Focused = $command.focused -eq $true
                $ReuseRegions = @($command.regions)
                $ReuseCapture = $command.reuseCapture -eq $true
                Recognize-Frame
            }
        } catch { Write-Result @{ type = 'error'; message = $_.Exception.Message } }
    }
} finally { if ($script:lastCapture) { $script:lastCapture.bitmap.Dispose() } }
