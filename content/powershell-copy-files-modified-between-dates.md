Title: Copying files modified between two dates with Powershell
Abstract: How to copy a subset of files from one folder to another, filtering on last modified date.
Published: 2020-11-07 09:13
Updated: 2020-11-07 09:13

I've recently had the need to copy a subset of files modified between two dates, from a folder containing many thousands. Powershell makes this quite easy, but it took a _little_ bit of figuring out, so I thought I'd share it!

I have this saved as `Copy-Files-Modified-Between-Dates.ps1`:

    :::powershell
    [CmdletBinding(SupportsShouldProcess=$true)]
    param (
        [Parameter(Mandatory=$true)][string]$SourceDirectory,
        [Parameter(Mandatory=$true)][string]$DestinationDirectory,
        [Parameter(Mandatory=$true)][string]$ModifiedAfter,
        [Parameter(Mandatory=$true)][string]$ModifiedBefore
    )

    Get-ChildItem -Path $SourceDirectory | 
    Sort-Object -Property LastWriteTime -Descending | 
    Where-Object { 
        $_.LastWriteTime `
            -gt (Get-Date $ModifiedAfter) `
            -and $_.LastWriteTime -lt (Get-Date $ModifiedBefore) } | 
    ForEach-Object { $_ | Copy-Item -Destination $DestinationDirectory }

Note that this cmdlet supports the standard PS `-WhatIf` parameter, so you can check the correct files are going to be copied _before_ actually performing the copy.

You can run the command like this:

    :::powershell
    .\Copy-Files-Modified-Between-Dates `
        -SourceDirectory C:\Temp\all `
        -DestinationDirectory C:\Temp\subset `
        -ModifiedAfter '2020-11-01 18:00' `
        -ModifiedBefore '2020-11-02'