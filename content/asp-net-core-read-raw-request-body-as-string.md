Title: Reading the raw request body as a string in ASP.NET Core
Abstract: This seems like it should be trivially simple... but isn't. There are a number of gotchas, all explained here.
Published: 2021-03-20 12:39
Updated: 2021-03-20 12:39

ASP.NET MVC model binding is great, but occasionally you just need to access the body of a request as a raw string within a controller method.

## ASP.NET MVC 5 (and probably some previous versions)

In the .NET Framework version of MVC, this is simple. You first reset the position of the stream, then re-read it:

    :::csharp{StreamReader}
    Request.InputStream.Position = 0;

    var rawRequestBody = new StreamReader(Request.InputStream).ReadToEnd();

The stream positon reset is needed because the MVC framework will already have read the stream content, in order to use it internally. Without it, you just read zero bytes and hence get an empty string.

## ASP.NET Core

In Core MVC, it seems things are significantly more complicated.

The same "empty string" problem occurs when you read from the stream without resetting it, so we need to do that. There is no `Request.InputStream` now, as `Request.Body` is itself a `Stream`, but let's try a direct translation:

    :::csharp{StreamReader}
    Request.Body.Position = 0;

    var rawRequestBody = new StreamReader(Request.Body).ReadToEnd();

That looks fine, and compiles... but throws a `NotSupportedException` at runtime.

In fact, trying to reset the stream position by _any_ of the standard methods will result in a `NotSupportedException` being thrown.

So the first part of the puzzle—not being able to reset the stream position—is solved like this:

    :::csharp{StreamReader}
    Request.EnableBuffering();

    Request.Body.Position = 0;

    var rawRequestBody = new StreamReader(Request.Body).ReadToEnd();

`Request.EnableBuffering()` just calls the internal [`BufferingHelper.EnableRewind()`](https://source.dot.net/#Microsoft.AspNetCore.Http/Internal/BufferingHelper.cs,14) method, which replaces the request body with a seekable stream and correctly registers it for disposal/cleanup by the framework.

However, this code _still_ doesn't work, throwing an `InvalidOperationException` at runtime, with a `Synchronous operations are disallowed` message.

So, you need to call the _asynchronous_ read method of `StreamReader` and `await` the result:

    :::csharp{StreamReader}
    Request.EnableBuffering();

    Request.Body.Position = 0;

    var rawRequestBody = await new StreamReader(request.Body).ReadToEndAsync();

Now everything works, giving us a string containing all the body content. 

I've wrapped this up into a helper extension, with one extra tweak: resetting the `Body` stream position back to 0 after the read (it's only polite):

    :::csharp{Task|StreamReader}
    public static async Task<string> GetRawBodyAsync(
        this HttpRequest request,
        Encoding encoding = null)
    {
        if (!request.Body.CanSeek)
        {
            // We only do this if the stream isn't *already* seekable,
            // as EnableBuffering will create a new stream instance
            // each time it's called
            request.EnableBuffering();
        }

        request.Body.Position = 0;

        var reader = new StreamReader(request.Body, encoding ?? Encoding.UTF8);

        var body = await reader.ReadToEndAsync().ConfigureAwait(false);

        request.Body.Position = 0;

        return body;
    }

Now I can call this in a controller action to get the raw body string, while also still having access to any bound models and/or the `Request.Form` collection.

    :::csharp{Task|IActionResult}
    [HttpPost]
    public async Task<IActionResult> ExampleAction()
    {
        var rawRequestBody = await Request.GetRawBodyAsync();

        // Other code here

        return Ok();
    }

Considering how simple it sounds, this was surprisingly tricky, so I hope this little write-up helps you out if you're having the same problem.