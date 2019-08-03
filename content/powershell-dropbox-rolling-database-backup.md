Title: Rolling database backups to Dropbox using Powershell
Abstract: Automating SQL Server database backups using Powershell and the Dropbox API.
Published: 2019-05-06 09:00
Updated: 2019-05-06 09:00

I have a few SQL Server Express databases on my personal cloud server. None are _super_ important, but it would be a bit of a pain to lose them, so I decided to start backing them up.

I've been writing a lot of Powershell scripts recently, and this looked like another good use case. Plus, I already had a Dropbox account, which seemed the ideal place to store a few small backup files. So, here's my automated solution.

## Create a Dropbox application

The Dropbox API requires [OAuth](https://oauth.net/) authorisation. Our script is going to run unattended, so we'll need an OAuth access token. This will allow us to make API calls without going through the OAuth authorisation flow. 

To get an access token for your Dropbox account, create a new application using the [app console](https://www.dropbox.com/developers/apps). Choose the option to restrict access to a specific folder, then name it something recognisable.

Once you've created a new application, look for the OAuth 2 settings and generate an access token. Copy/paste the token somewhere safe as soon as it's created; it'll disappear when you leave the page and you'll have to create a new token to see it again.

## Write a Powershell script to perform the backup

Dropbox provides an HTTP REST API, so we can consume it using the Powershell `Invoke-RestMethod` cmdlet. Here's a Powershell function which will upload a file to Dropbox:

    :::powershell
    function Upload-FileToDropbox { 
        param(
            [Parameter(Mandatory=$true)]
            [string]$SourcePath,
            [Parameter(Mandatory=$true)]
            [string]$TargetPath,
            [Parameter(Mandatory=$true)]
            [string]$AccessToken
        )

        $body = '{ "path": "' + $TargetPath + '", "mode": "overwrite" }'

        $authorization = "Bearer $AccessToken"

        $headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"

        $headers.Add("Authorization", $authorization)
        $headers.Add("Dropbox-API-Arg", $body)
        $headers.Add("Content-Type", 'application/octet-stream')
         
        Invoke-RestMethod `
            -Uri 'https://content.dropboxapi.com/2/files/upload' `
            -Method Post `
            -InFile $SourcePath `
            -Headers $headers
    }

Because these databases aren't critical, we only need the last few backups of each. We'll delete any older files, each time the script runs. So we also need a delete function:

    :::powershell
    function Remove-FileFromDropbox { 
        param(
            [Parameter(Mandatory=$true)]
            [string]$TargetPath,
            [Parameter(Mandatory=$true)]
            [string]$AccessToken
        )

        $body = '{ "path": "' + $TargetPath + '" }'

        $authorization = "Bearer $AccessToken"

        $headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"

        $headers.Add("Authorization", $authorization)
        $headers.Add("Content-Type", 'application/json')

        Invoke-RestMethod `
            -Uri 'https://api.dropboxapi.com/2/files/delete_v2' `
            -Method Post `
            -Headers $headers `
            -Body $body
    }


Finally, we tie those functions together:

    :::powershell
    $AccessToken = '{YOUR_ACCESS_TOKEN_HERE}'
    $BackupPath 'C:\temp\db-backups'
    $DatabaseNames = 'database1', 'database2'

    $dateStamp = (Get-Date).ToString("yyyy-MM-dd-HHmm")

    $DatabaseNames | ForEach-Object {
        $databaseName = $_
        $backupFilename = "$databaseName-$dateStamp.bak"
        $backupFilePath = "$BackupPath\$backupFilename"

        $command = "BACKUP DATABASE [$databaseName] TO DISK='$backupFilePath' WITH COMPRESSION, INIT, STATS = 10"

        # Perform the database backup to a local folder
        Invoke-Sqlcmd -HostName 'localhost' -Query $command

        # Send the backup file to Dropbox
        Upload-FileToDropbox `
            -SourcePath $backupFilePath `
            -TargetPath "/$backupFilename" `
            -AccessToken $AccessToken

        # Get all but the last three backups
        $oldFiles = 
            Get-ChildItem $BackupPath -Filter "$databaseName*.bak" | 
            Sort-Object CreationTime -Descending | 
            Select-Object -Skip 3
        
        # Delete the old backups from Dropbox
        $oldFiles | ForEach-Object { Remove-FileFromDropbox -TargetPath "/$_" -AccessToken $AccessToken }
        
        # Delete the old backups locally
        $oldFiles | Remove-Item -Force
    }

This will create time-stamped backup files for the specified databases, upload them, then delete any old backups. I _hope_ this code explains itself, but feel free to ask questions in the comments. 

[The complete script is available here](https://gist.github.com/markashleybell/328fe4c40c279808253a78cef9f6ea62); we can call it like this:

    .\dropbox-db-backup.ps1 `
        -AccessToken {YOUR_ACCESS_TOKEN_HERE} `
        -BackupPath C:\temp\db-backups `
        -DatabaseNames 'database1', 'database2'

## Set up a scheduled task

Now we have the script, we can easily schedule it to run on a regular basis. In my case, I created a basic task in Windows Task Scheduler which runs the script every few hours.

One gotcha here: due to the tricky [quoting rules](https://stackoverflow.com/questions/14989073/parameters-with-double-quotes-are-not-properly-passed-to-scriptblock-by-argument), I found it difficult to pass Powershell parameters from Task Scheduler in the correct format. 

A simple workaround is to create another `.ps1` file which just contains the hard-coded script call with all parameters (I called mine `dropbox-db-backup-scheduled.ps1`). We can then tell Task Scheduler to run _that_, with no need to specify any parameters.









