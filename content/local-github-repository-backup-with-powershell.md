Title: Local GitHub repository backups with Powershell
Abstract: How to back up all your GitHub repositories to your local computer, using Powershell and the GitHub GraphQL API.
Published: 2019-08-10 09:30
Updated: 2019-08-10 08:30

I'm always aware that all of my precious source code lives on someone else's servers. Much as I love [GitHub](https://github.com "External Link: GitHub")—and however unlikely it is to suddenly disappear—I still like to keep local backups of my code (which I can then back up somewhere off-site).

This was my first foray into [GraphQL](https://graphql.org/ "External Link: graphql.org") (which the GitHub API uses for data queries). I don't pretend to fully understand it yet, but having done a **lot** of development against REST APIs, I can definitely see the advantages!

## Create a GitHub personal access token

These are application-specific OAuth tokens, which you can use for scripted interactions with the GitHub API. They don't require any user intervention during authentication, so are ideal for unattended processes, and can be revoked quickly without affecting any other applications.

Log in to your GitHub profile, go to [https://github.com/settings/tokens](https://github.com/settings/tokens "External Link: GitHub Token Settings"), and click the **Generate new token** button.

You'll see a screen which lists a ton of OAuth scopes. This script will need access to  repositories, so we'll need to select the `repo` scope. Unfortunately, this also provides *write* access to repositories (see [here](https://github.com/jollygoodcode/jollygoodcode.github.io/issues/6 "External Link: Read-Only OAuth Scope on GitHub, Please? (GitHub)") and [here](https://github.com/dear-github/dear-github/issues/113 "External Link: GitHub's Permission System is Flawed (GitHub)") for the issue), but our script is only going to fetch repository names/URLs, so nothing to worry about too much in this instance.

Once you've checked the `repo` checkbox, add a note to say what the token is for, then click the **Generate token** button. Once it's been created, copy the token and keep it somewhere safe.

## Powershell script

The script itself is pretty straightforward, as all we're doing is fetching a list of repository names and URLs, then iterating over them and either creating or updating a local `git` mirror for each.

**Please note**: as it stands, this script will only work if you have <= 100 repositories, as the GitHub GraphQL API will only return a maximum of 100 items on a single query. Modifying it to page through the results is certainly possible (and probably not too tricky), but for now I'm just going for simplicity!

    :::powershell
    param(
        [Parameter(Mandatory=$true)]
        [string]$Username,
        [Parameter(Mandatory=$true)]
        [string]$GitHubAccessToken,
        [Parameter(Mandatory=$true)]
        [string]$BackupFolderPath
    )

    $initialWorkingPath = Convert-Path '.'

    # Create the authorisation headers using our access token
    $bytes = [System.Text.Encoding]::UTF8.GetBytes("${Username}:${GitHubAccessToken}")
    $base64Credentials =[Convert]::ToBase64String($Bytes)

    $authorization = "Basic $base64Credentials"

    $headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"

    $headers.Add("content-type", "application/json")
    $headers.Add("Authorization", $authorization)

    # This is the GraphQL query, which gets us the first
    # 100 repos belonging to the specified username
    $graphql = @"
    query { 
        user(login:"$Username") { 
            repositories(first:100) { 
                nodes { name url } 
            } 
        } 
    }
    "@

    # We're going to wrap the GraphQL query in JSON, so 
    # we need to escape it accordingly. 

    # However, ConvertTo-Json converts newlines to \r\n, 
    # which the API endpoints fail to parse... 

    # https://developer.github.com/v4/guides/forming-calls/#communicating-with-graphql

    # So, first we remove newlines and multiple spaces
    $queryJson = $graphql `
        -replace "[\r\n]+", " " `
        -replace "\s{2,}", " "

    # The API request body is a JSON wrapper, with a
    # 'query' property containing the actual query
    $body = '{ "query": ' + (ConvertTo-Json $queryJson) + '}'

    function Write-Divider {
        Write-Host "-----------------------------------------"
    }     

    try {
        $response = Invoke-WebRequest `
            -Uri 'https://api.github.com/graphql' `
            -Method POST `
            -Headers $headers `
            -Body $body

        $responseJson = (ConvertFrom-Json $response)

        $repos = $responseJson.data.user.repositories.nodes

        $repos | ForEach {
            $name = $_.name

            $mirrorPath = "$BackupFolderPath\$name.git"

            # Check if the repository already exists; if it does, 
            # we'll need to call a different git command
            $exists = Test-Path -Path $mirrorPath

            Write-Host ""

            if ($exists) {
                "Updating $name"
                Write-Divider
                cd $mirrorPath
                git remote update
                Write-Divider
            } else {
                "Cloning $name"
                Write-Divider
                cd $BackupFolderPath
                git clone $_.url --mirror
                Write-Divider
            }
        }
    } finally {
        # We've been cd'ing about all over the place, 
        # so go back to where we started
        cd $initialWorkingPath
    }

[The complete script is available here](https://gist.github.com/markashleybell/75c76bddc973d39283d6a23331987d9e "External Link: GitHub Repository Backup Gist"); we can call it like this:

    .\github-mirror.ps1 `
        -Username [YOUR_USERNAME] `
        -GitHubAccessToken [YOUR_GENERATED_TOKEN] `
        -BackupFolderPath [PATH]

You can then run it on a schedule by setting up a scheduled task, or call it from your favourite workflow app: whatever works best for you. That's all there is to it!