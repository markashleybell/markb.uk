Title: Building a simple Google Chrome extension
Abstract: In this example, I walk through creating a simple extension for Google Chrome which grabs the title, url and any selected text from the current page.
Thumbnail: chrome-extension-screenshot.gif
Published: 2010-01-26 08:41
Updated: 2014-09-30 07:23

I have a web app running on my home server to keep track of my bookmarks—it's a little like [Delicious](https://delicious.com/ "External Link: Delicious"), but much simpler and with some personal customisations. I currently save bookmarks to this app via a Javascript bookmarklet: clicking it gets the current page's title and url (and also any selected text, to use as a summary) and sends it to a popup form; submitting that form then POSTs the bookmark data to the server.

Although this system works well enough, it looks a bit untidy and takes up space in the bookmarks bar. With the advent of [Extensions for Chrome](http://www.theregister.co.uk/2010/01/25/google_chrome_4_stable/ "External Link: Google Chrome"), I thought I'd have a go at writing an extension to nicely integrate my custom page bookmarking button into the Chrome browser.

![Screen Shot](~/img/post/chrome-extension-screenshot.gif "Screen Shot")

It's clear from the start that Chrome's extension structure is a lot simpler than that of [Firefox extensions](http://kb.mozillazine.org/Getting_started_with_extension_development "External Link: Firefox Extensions"). Chrome extensions are just a collection of plain HTML and JavaScript files—no odd folder hierarchies or XUL to deal with here. There are advantages to Mozilla's approach (ease of internationalisation, UI consistency), but I can't help feeling that building Chrome extensions will be much more accessible to amateur developers; I'm betting that this is exactly what Google was aiming for.

So let's get stuck in! First, create a new folder for your extension code—for now it doesn't matter where. My basic Chrome extension consists of just a few files:

## manifest.json

This is the glue that holds our extension together. It contains the basic meta data about the extension (title, description etc), as well as acting as a pointer to the various files that contain the extension's user interface and JavaScript code. It also defines permissions that specify which browser components and external URLs the extension is allowed to access. The manifest for our extension looks like this:

    :::javascript
    {
        "manifest_version": 2,
        "name": "Bookmark Extension Example",
        "description": "POST details of the current page to a remote endpoint.",
        "version": "0.2",
        "background": {
            "scripts": ["event.js"],
            "persistent": false
        },
        "browser_action": {
            "default_icon": "icon.png",
            "default_popup": "popup.html"
        },
        "permissions": [
            "tabs",
            "http://*/*",
            "https://*/*"
        ]
    }

The `background` property points to a JavaScript file which contains the logic code for the extension. The `browser_action` section defines a button with an icon, which the user will click to open the bookmarking dialog, and the `popup` property points to the file containing the dialog form HTML.

## popup.html

This file contains our UI: a basic HTML form with title, url, summary and tag fields (so that we can edit and tag our bookmark before saving it).

    :::html
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                min-width: 420px;
                overflow-x: hidden;
                font-family: Arial, sans-serif;
                font-size: 12px;
            }
            input, textarea {
                width: 420px;
            }
            input#save {
                font-weight: bold; width: auto;
            }
        </style>
        <script src="popup.js"></script>
    </head>
    <body>
        <form id="addbookmark">
            <p>
                <label for="title">Title</label><br />
                <input type="text" id="title" name="title" size="50" value="" />
            </p>
            <p>
                <label for="url">Url</label><br />
                <input type="text" id="url" name="url" size="50" value="" />
            </p>
            <p>
                <label for="summary">Summary</label><br />
                <textarea id="summary" name="summary" rows="6" cols="35">
                </textarea>
            </p>
            <p>
                <label for="tags">Tags</label><br />
                <input type="text" id="tags" name="tags" size="50" value="" />
            </p>
            <p>
                <input id="save" type="submit" value="Save Bookmark" />
                <span id="status-display"></span>
            </p>
        </form>
    </body>
    </html>

## popup.js

This file contains JavaScript code to populate and save field values. You can [download the complete source here](https://github.com/markashleybell/mab_bookmark_extension/archive/0.3.zip "External Link: Chrome Extension Source Download"), but for now the important part is the script itself:

    :::javascript
    // This callback function is called when the content script has been
    // injected and returned its results
    function onPageDetailsReceived(pageDetails) {
        document.getElementById('title').value = pageDetails.title;
        document.getElementById('url').value = pageDetails.url;
        document.getElementById('summary').innerText = pageDetails.summary;
    }

    // Global reference to the status display SPAN
    var statusDisplay = null;

    // POST the data to the server using XMLHttpRequest
    function addBookmark() {
        // Cancel the form submit
        event.preventDefault();

        // The URL to POST our data to
        var postUrl = 'http://post-test.local.com';

        // Set up an asynchronous AJAX POST request
        var xhr = new XMLHttpRequest();
        xhr.open('POST', postUrl, true);

        // Prepare the data to be POSTed by URLEncoding each field's contents
        var title = document.getElementById('title');
        var url = document.getElementById('url');
        var summary = document.getElementById('summary');
        var tags = document.getElementById('tags');

        var params = 'title=' + encodeURIComponent(title.value) +
                     '&url=' + encodeURIComponent(url.value) +
                     '&summary=' + encodeURIComponent(summary.value) +
                     '&tags=' + encodeURIComponent(tags.value);

        // Replace any instances of the URLEncoded space char with +
        params = params.replace(/%20/g, '+');

        // Set correct header for form data
        var formContentType = 'application/x-www-form-urlencoded';
        xhr.setRequestHeader('Content-type', formContentType);

        // Handle request state change events
        xhr.onreadystatechange = function() {
            // If the request completed
            if (xhr.readyState == 4) {
                statusDisplay.innerHTML = '';
                if (xhr.status == 200) {
                    // If it was a success, close the popup after a short delay
                    statusDisplay.innerHTML = 'Saved!';
                    window.setTimeout(window.close, 1000);
                } else {
                    // Show what went wrong
                    statusDisplay.innerHTML = 'Error saving: ' + xhr.statusText;
                }
            }
        };

        // Send the request and set status
        xhr.send(params);
        statusDisplay.innerHTML = 'Saving...';
    }

    // When the popup HTML has loaded
    window.addEventListener('load', function(evt) {
        // Cache a reference to the status display SPAN
        statusDisplay = document.getElementById('status-display');
        // Handle the bookmark form submit event with our addBookmark function
        document.getElementById('addbookmark')
                .addEventListener('submit', addBookmark);
        // Get the event page
        chrome.runtime.getBackgroundPage(function(eventPage) {
            // Call the getPageInfo function in the event page, passing in
            // our onPageDetailsReceived function as the callback. This
            // injects content.js into the current tab's HTML
            eventPage.getPageDetails(onPageDetailsReceived);
        });
    });

This may look a little confusing at first, but hopefully it will make more sense when you see the rest!

## event.js

Think of this file as the negotiator between the popup dialog and the content/DOM of the currently loaded web page. `getPageDetails` is the function we called when our popup loaded, and its parameter is the callback function which sets the values of the form fields in `popup.js`.

    :::javascript
    // This function is called onload in the popup code
    function getPageDetails(callback) {
        // Inject the content script into the current page
        chrome.tabs.executeScript(null, { file: 'content.js' });
        // When a message is received from the content script
        chrome.runtime.onMessage.addListener(function(message) {
            // Call the callback function
            callback(message);
        });
    };

When `getPageDetails` is called, it injects the content script (below) into the DOM of the current web page and executes it. It then sets up an event listener to listen for the `onMessage` event which will be triggered by the content script.

## content.js

The content script itself is pretty simple: it just gets the title, url and any selected text from the current page and passes them back to the event script by calling `sendMessage`, which triggers the `onMessage` event we're listening for in `event.js`.

    :::javascript
    // Send a message containing the page details back to the event page
    chrome.runtime.sendMessage({
        'title': document.title,
        'url': window.location.href,
        'summary': window.getSelection().toString()
    });

The event script listener then calls the callback function it was passed (which, if you remember, is the `onPageDetailsReceived` function from the popup page), passing in the information about the page so that it can populate the form field values.

To test your extension, open the Chrome Extensions tab (Tools > Extensions), check 'Developer Mode' and click 'Load unpacked extension...'. Browse to your extension's folder and select it: you'll see the icon appear in your browser toolbar. Click it while viewing any normal web page and you should see a popup like the one in the screen shot at the beginning of this article, populated with the data from the current page.

You can [download all the source code here](https://github.com/markashleybell/mab_bookmark_extension/archive/0.3.zip "External Link: Chrome Extension Source Download") and modify it to suit your own purposes, or just use it to learn from. If you find any mistakes or bugs, feel free to [add an issue or pull request on GitHub](https://github.com/markashleybell/mab_bookmark_extension  "External Link: Chrome Extension GitHub Repository").

That's it! The [Google extension documentation](https://developer.chrome.com/extensions/getstarted.html "External Link: Google Chrome Extension Documentation") is comprehensive and very useful to learn from. I also picked up a lot of good information from [this thread on the Chromium Extensions Google Group](https://groups.google.com/forum/#!topic/chromium-extensions/6rhH8KMuwlw "External Link: Chromium Extensions Google Group").