param([int]$Port = 4173)

$Root = $PSScriptRoot
$Listener = [System.Net.HttpListener]::new()
$Listener.Prefixes.Add("http://127.0.0.1:$Port/")
$Listener.Start()

$MimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".png"  = "image/png"
  ".svg"  = "image/svg+xml"
  ".webp" = "image/webp"
}

Write-Host "Estetica Marista preview running at http://127.0.0.1:$Port/"

while ($Listener.IsListening) {
  $Ctx = $Listener.GetContext()
  $RelPath = $Ctx.Request.Url.AbsolutePath.TrimStart('/')
  if ([string]::IsNullOrWhiteSpace($RelPath)) { $RelPath = "index.html" }

  $FullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $RelPath))
  if (-not $FullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $FullPath -PathType Leaf)) {
    $Ctx.Response.StatusCode = 404
    $Ctx.Response.Close()
    continue
  }

  $Ext = [System.IO.Path]::GetExtension($FullPath).ToLowerInvariant()
  $Ctx.Response.ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }
  $Bytes = [System.IO.File]::ReadAllBytes($FullPath)
  $Ctx.Response.ContentLength64 = $Bytes.Length
  $Ctx.Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
  $Ctx.Response.OutputStream.Close()
}
