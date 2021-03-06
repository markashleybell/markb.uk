Title: Portable Git for Windows: setting the $HOME environment variable to allow complete portability (including SSL keys and configuration for use with GitHub)
Abstract: There are a few issues which make Portable Git not quite as portable as it could be. In this article, I  explain the gotchas and walk you through creating a tweaked Portable Git for Windows install which is truly self contained.
Thumbnail: git-version.gif
Published: 2010-11-17 08:17
Updated: 2010-11-17 08:17

Portable Git is a completely standalone version of the [Git](http://git-scm.com/ "External Link: Git") distributed version control system. All you need do to get going is to download a file and unzip it into a folder. In theory, what you end up with is a self-contained Git install which doesn't touch any other part of your Windows system, meaning that you can take your entire, ready configured version control system with you from computer to computer on a portable drive.

However, there are a few issues which make Portable Git not quite as portable as it could be. In this article, I'm going to explain the gotchas and walk you through creating a tweaked Portable Git for Windows install which is truly self contained. Even if you don't need to carry it around with you, it's still useful to keep all your Git configuration files and scripts in one place where you can easily find them.

The first step is to [download the zip file containing Portable Git](http://code.google.com/p/msysgit/downloads/list "External Link: Portable Git"). Once you have the file, unzip its contents into a folder of your choice. I chose to put mine in `E:\Git`.

Now open the new Git folder. Inside you'll see a number of folders and files. Run the batch file named `git-bash.bat` and you should see a shell prompt screen. Type the following:

    git --version

You should see something like this (possibly with a different version number, depending on the version you downloaded):

![Screen Shot](~/img/post/git-version.gif "Screen Shot")

By default, Git and MSys (the minimal UNIX system it runs under on Windows) look for configuration items—startup scripts, SSL keys etc—in the current user's home folder, which on my Windows 7 machine is `C:\Users\Mark`.

There's sensible reasoning behind this, because it allows for different users on the same machine to have their own individual Git settings. However, if you install Git on a portable drive, you'll want your settings to travel with the installation—which obviously they won't if it is looking for them in a folder which may not exist on other computers.

So, what we need to do is tell Portable Git to treat a specific location within its own folder as the home folder; that way we can copy the whole Git folder anywhere we like and the settings will travel with it.

Create a folder within the Git folder called `home`. I also created a sub folder within this folder called `mark`, to follow UNIX convention and in case I want to create different settings in the future.

Now we need to set the `$HOME` environment variable, which is how Git knows where to look for the current user's home folder. I found the easiest way to do this was to edit `E:\Git\etc\profile` and override the `$HOME` variable on startup. Find these lines:

    # normalize HOME to unix path
    HOME="$(cd "$HOME" ; pwd)"

And on the line _before_ them add this:

    HOME="/home/mark"

Where the path is the folder you just created, _relative to the folder in which you installed Git_ (thanks to commenter Genesis2001 for the heads-up on this). Note that this is in UNIX format rather than Windows, so `\home\mark` became `/home/mark`. Close any Git shell windows you have open and run `git-bash.bat` again. When the prompt opens, type:

    echo $HOME

You should see the UNIX path you entered: this means Git is now using your new folder as its home folder. Now we'll set the global name and email address which will be associated with Git commits; in order to use [GitHub](https://github.com/ "External Link: GitHub"), we also need to generate an SSL key pair for authentication. Enter the following two commands at the shell prompt to set the global variables:

    git config --global user.name "Your Name"
    git config --global user.email you@yourdomain.com

Now that we have pointed Portable Git to the correct folder, you should be able to follow the excellent [GitHub Help guide to generating an SSL key pair](https://help.github.com/msysgit-key-setup "External Link: SSL Setup Help (GitHub)"). Once you’ve done that, change to the new home folder and create an empty file named `profile` (no extension—the filename would normally be `.profile` under UNIX, but MSYS lets you omit the period to make things easier under Windows).

Open it up, paste in the following code from [this GitHub guide](https://help.github.com/working-with-key-passphrases/ "External Link: Working With Key Passphrases (GitHub)") and save:

    :::sh
    SSH_ENV="$HOME/.ssh/environment"

    # start the ssh-agent
    function start_agent {
        echo "Initializing new SSH agent..."
        # spawn ssh-agent
        ssh-agent | sed 's/^echo/#echo/' > $SSH_ENV
        echo succeeded
        chmod 600 $SSH_ENV
        . $SSH_ENV > /dev/null
        ssh-add
    }

    # test for identities
    function test_identities {
        # test whether standard identities have been added to the agent already
        ssh-add -l | grep "The agent has no identities" > /dev/null
        if [ $? -eq 0 ]; then
            ssh-add
            # $SSH_AUTH_SOCK broken so we start a new proper agent
            if [ $? -eq 2 ];then
                start_agent
            fi
        fi
    }

    # check for running ssh-agent with proper $SSH_AGENT_PID
    ps -ef | grep $SSH_AGENT_PID | grep ssh-agent > /dev/null
    if [ $? -eq 0 ]; then
        test_identities
    # if $SSH_AGENT_PID is not properly set, we might be able to load one from
    # $SSH_ENV
    else
        . $SSH_ENV > /dev/null
        ps -ef | grep $SSH_AGENT_PID | grep ssh-agent > /dev/null
        if [ $? -eq 0 ]; then
            test_identities
        else
            start_agent
        fi
    fi

This will ensure that `ssh-agent` is run when you start the Git shell, meaning you don't have to type in your SSL Passphrase every time you authenticate.

And that's it! You now have a completely standalone Portable Git install. Simply copy the whole Git folder to another machine or portable drive and you can continue working with your Git shell, without having to go through all these configuration steps again in every new situation.

**Cautionary Note:** if you're carrying your install about on a USB drive, be careful with your private SSL key! If someone gets hold of it, they can potentially authenticate as you until you revoke that key's access from within GitHub.
