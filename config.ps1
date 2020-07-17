$config = Get-Content -Path ".\config.cfg"

$content = $config `
    -ireplace "site_url: .*", "site_url: $env:SiteUrl" `
    -ireplace "cdn1: .*", "cdn1: $env:CDN1Url" `
    -ireplace "cdn2: .*", "cdn2: $env:CDN2Url" `
    -ireplace "analytics_id: ANALYTICS_ID", "analytics_id: $env:AnalyticsID" `
    -ireplace "disqus_id: DISQUS_ID", "disqus_id: $env:DisqusID"

$content | Set-Content -Path ".\config.cfg"
