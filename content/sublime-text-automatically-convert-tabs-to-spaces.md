Title: Automatically converting tabs to spaces on file open in Sublime Text
Abstract: A Sublime Text plugin to automatically convert tabs to spaces when a file is opened.
Published: 2013-11-03 08:19
Updated: 2014-03-12 06:02

Although there is of course a great deal of [controversy](http://programmers.stackexchange.com/questions/57/tabs-versus-spaceswhat-is-the-proper-indentation-character-for-everything-in-e "External Link: Tabs Versus Spaces (Stack Overflow)") surrounding the issue (!?), I prefer spaces over tabs when indenting code.

In order to keep my indentation consistent, I've written a [Sublime Text](http://www.sublimetext.com/ "External Link: Sublime Text") plugin, which detects the presence of tab characters in any file I open and replaces them with the correct number of spaces, using Sublime's built in conversion feature:

    :::python
    class ExpandTabsOnLoad(sublime_plugin.EventListener):
        # Run ST's 'expand_tabs' command when opening a file,
        # only if there are any tab characters in the file
        def on_load(self, view):
            expand_tabs = view.settings().get("expand_tabs_on_load", False)
            if expand_tabs and view.find("\t", 0):
                view.run_command("expand_tabs", {"set_translate_tabs": True})
                tab_size = view.settings().get("tab_size", 0)
                message = "Converted tab characters to {0} spaces"
                sublime.status_message(message.format(tab_size))

Add a key named `expand_tabs_on_load` with a value of `true` to your global, user, project or syntax-specific `.sublime-settings` file to enable the plugin:

    :::javascript
    {
        "expand_tabs_on_load": true
    }

Most of the similar plugins I've tried perform the tab replacement silently, when the file is saved. I prefer to do the replacement on load, because it allows a quick visual check of the file before committing to the changes. If you _do_ want to silently replace tabs on save, [this solution](https://coderwall.com/p/zvyg7a) by Paulo Rodrigues Pinto works nicely.

[The source code can be found here](https://github.com/markashleybell/ExpandTabsOnLoad "External Link: ExpandTabsOnLoad GitHub Repository"); I welcome any contributions or improvements!
