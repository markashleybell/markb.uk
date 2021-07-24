$config = Get-Content -Path ".\fwords.cfg"

$content = $config `
    -ireplace "site_url: .*", "site_url: $env:SiteUrl"

$content | Set-Content -Path ".\fwords.cfg"
