Title: Check the status of multiple Git working copies with Powershell
Abstract: How to check the status of every Git working copy in a folder, and return information about untracked/uncommitted changes.
Published: 2021-02-15 06:00
Updated: 2021-02-15 06:00

## Background

I work with several folders containing multiple Git working copies, so I often find myself getting distracted and forgetting to commit or push changes, particularly when quickly switching between projects.

A couple of years ago I wrote a command line utility called [gitinsync](https://github.com/markashleybell/gitinsync), which would give me back the status of every working copy in a given folder, so that I could periodically check if there were changes I hadn't committed. `gitinsync` uses [LibGit2Sharp](https://github.com/libgit2/libgit2sharp) to query the `origin` repository and compare its state with the local working copy. 

However, this tool has a number of flaws; the main one being that it doesn't work with repositories cloned over SSH; `LibGit2Sharp` [has no current or planned support for SSH authentication](https://github.com/libgit2/libgit2sharp/issues/1422), for valid reasons. It also feels rather overcomplicated...

So I decided to try and reproduce the behaviour of `gitinsync`, using only Git itself (instant 100% support for the whole Git feature set!) and a bit of Powershell.

## The script

In summary: we loop over all child folders containing a `.git` folder, then run `git status --porcelain` in each, transform the results and display a nice, easy-to-scan table.

    :::powershell{Char|Array|PSCustomObject}
    # Escape and colour codes for use in virtual terminal escape sequences
    $esc = [char]27
    $red = '31'
    $green = '32'

    # Get child folders of the current folder which contain a '.git' folder
    Get-ChildItem -Path . -Attributes Directory+Hidden -Recurse -Filter '.git' | 
    ForEach-Object { 
        # Assume the parent folder of this .git folder is the working copy
        $workingCopy = $_.Parent
        $repositoryName = $workingCopy.Name

        # Change the working folder to the working copy
        Push-Location $workingCopy.FullName

        # Update progress, as using -AutoSize on Format-Table
        # stops anything being written to the terminal until 
        # *all* processing is finished
        Write-Progress `
            -Activity 'Check For Local Changes' `
            -Status 'Checking:' `
            -CurrentOperation $repositoryName

        # Get a list of untracked/uncommitted changes
        [Array]$gitStatus = $(git status --porcelain) | 
            ForEach-Object { $_.Trim() }

        # Status includes VT escape sequences for coloured text
        $status = ($gitStatus) `
            ? "$esc[$($red)mCHECK$esc[0m" `
            : "$esc[$($green)mOK$esc[0m"

        # For some reason, the git status --porcelain output returns 
        # two '?' chars for untracked changes, when all other statuses 
        # are one character... this just cleans it up so that it's 
        # nicer to scan visually in the terminal
        $details = ($gitStatus -replace '\?\?', '?' | Out-String).TrimEnd()

        # Change back to the original directory
        Pop-Location

        # Return a simple 'row' object containing all the info
        [PSCustomObject]@{ 
            Status = $status
            'Working Copy' = $repositoryName
            Details = $details
        }
    } |
    Format-Table -Wrap -AutoSize

There are a couple of things going on here which warrant a little more explanation.

## Git plumbing and porcelain 

If you haven't seen `git status --porcelain` before, it's just a way of getting consistent, machine-parsable output from the `git status` command. 

Confusingly, in the context of `git status`, the `--porcelain` switch actually means... [_not_ porcelain](https://stackoverflow.com/a/6978402/43140))—but I'm sure we're all used to the “quirks” of the Git CLI by now.

## Virtual Terminal escape sequences

These are [sequences of characters](https://docs.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences) which tell the terminal to transform the display or cursor in some way. 

In this case, we're using them to make the text in the status column red or green depending on whether there are changes or not (hat tip to [this Q&A](https://stackoverflow.com/a/49038815/43140) for showing me how to use these).

<p>
<br><small><strong>Note:</strong> this is Powershell <strong>7</strong>, so if you're using an earlier version, you'll need to rewrite the ternary conditional assigning to <code>$status</code> as a standard <code>if/else</code>.</small>
<p>