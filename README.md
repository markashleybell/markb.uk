# Static assets and content for [markb.uk](https://markb.uk)

## Prerequisites

- [f-words](https://github.com/markashleybell/f-words)

## Notes

IIS has some pretty silly default behaviour for custom 404 pages, so when you set 404 errors to return the static `404.html` file, it'll return a server error instead.

Open IIS Manager and select the server name. Then open *Configuration Editor* and navigate to `system.webServer/httpErrors` and unlock the `allowAbsolutePathsWhenDelegated` attribute.

Then open the site node, open the same configuration setting and change `allowAbsolutePathsWhenDelegated` to `true`.

See [here](https://serverfault.com/questions/583246/iis-8-5-getting-error-when-returning-static-404-file) for more detail.
