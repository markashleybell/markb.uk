Title: Copying files modified between two dates with Powershell, Retaining Original Folder Structure
Abstract: How to copy a subset of files from one folder to another, filtering on last modified date and keeping the same folder structure in the destination.
Published: 2023-03-21 19:39
Updated: 2023-03-21 19:39

I had an email yesterday from someone who had discovered [this old post](/powershell-copy-files-modified-between-dates.html) and wanted to know if it was possible to accomplish the same thing, but retain the original folder structure in the destination folder.

That sounded like a nice little puzzle, and it turned out to be a little trickier than I thought... what doesn't, right?

Anyway, with a bit of help from [this Stack Overflow answer](https://stackoverflow.com/a/7523632/43140), here's what I arrived at.

Save this as your `cmdlet` name of choice, e.g. `Copy-Files-Modified-Between-Dates-Recursive.ps1` (or perhaps something snappier):

    :::powershell
    [CmdletBinding(SupportsShouldProcess=$true)]
    param (
        [Parameter(Mandatory=$true)][string]$SourceDirectory,
        [Parameter(Mandatory=$true)][string]$DestinationDirectory,
        [Parameter(Mandatory=$true)][string]$ModifiedAfter,
        [Parameter(Mandatory=$true)][string]$ModifiedBefore
    )

    Get-ChildItem -Path $SourceDirectory -File -Recurse |
    Where-Object {
        $_.LastWriteTime `
            -gt (Get-Date $ModifiedAfter) `
            -and $_.LastWriteTime -lt (Get-Date $ModifiedBefore) } |
    ForEach-Object {
        $Destination = $_.FullName.Replace(
            $SourceDirectory,
            $DestinationDirectory)
        New-Item -Type File -Path $Destination -Force
        Copy-Item $_.FullName -Destination $Destination -Force }

As with the [previous version](/powershell-copy-files-modified-between-dates.html), note that this cmdlet supports the standard PS `-WhatIf` parameter, so you can check the correct files are going to be copied with the correct folder structure, _before_ actually performing the copy.

You can run the command like this:

    :::powershell
    .\Copy-Files-Modified-Between-Dates-Recursive `
        -SourceDirectory C:\Temp\all `
        -DestinationDirectory C:\Temp\subset `
        -ModifiedAfter '2020-11-01 18:00' `
        -ModifiedBefore '2020-11-02'
