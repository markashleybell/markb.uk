$config = Get-Content -Path ".\config.cfg"

$content = $config `
    -ireplace "site_url: .*", "site_url: $env:SiteUrl"

$content | Set-Content -Path ".\config.cfg"
