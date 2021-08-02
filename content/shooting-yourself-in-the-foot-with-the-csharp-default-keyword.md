Title: Shooting yourself in the foot with the C# default literal and nullable
Abstract: I'm writing this so you don't go through what I just went through.
Published: 2021-08-02 08:32
Updated: 2021-08-02 08:32

One of the things I love about C# is that the language designers are constantly refining it, so we regularly get new syntax to play with. I'm generally keen to adopt these new features, as they normally help us to write cleaner, more concise code.

However, I'd like to highlight something which caught me out: using the [default literal](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/default#default-literal) in conjunction with nullable values.

It's not the fault of the language feature itself, but rather a case of me blindly applying it without really thinking about it first—which is always dangerous!

## The `default` literal

We have had [default value expressions](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/default)—e.g. `default(int)`—for a long time* now. Here's a contrived example which assigns the default value for int (`0`) to the variable if the boolean `setValue` is false:

    :::csharp
    var setValue = false;
    var intValue = 123;
    var valueOrDefault = setValue ? intValue : default(int);

As of C# 7.1, the [default literal](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/default#default-literal) can _infer_ the type:

    :::csharp
    var valueOrDefault = setValue ? intValue : default;

Note that the type is inferred from the type returned by the other branch of the condition (`value`), _not_ from the type of the variable you're _assigning_ to; it couldn't possibly be anyway in this case, as it's declared with `var`. 

## How I shot myself in the foot...

I was building a [really simple cookie-based auth system](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/cookie?view=aspnetcore-5.0) in a .NET Core web app. Within the `Login` controller method, I added the following:

    :::csharp{ClaimsPrincipal|AuthenticationProperties}
    // Preceding code omitted for brevity

    var principal = new ClaimsPrincipal(identity);

    var authenticationProperties = new AuthenticationProperties {
        IsPersistent = model.RememberMe,
        ExpiresUtc = model.RememberMe 
            ? DateTimeOffset.UtcNow.AddDays(7) 
            : default
    };

    await HttpContext.SignInAsync(principal, authenticationProperties);

I expect some of you will already have spotted the mistake... but if not, read on!

`AuthenticationProperties.ExpiresUtc` determines how long the auth cookie hangs around in the client's browser. if the user checks the "Remember Me" checkbox, I want it to expire after 7 days; if not, the expiry time should be left as the default. 

`ExpiresUtc` is a `DateTimeOffset?`, so the `default` value would be `null`. This will cause the  cookie to be set as a session cookie, which expires when the browser is closed.

However, although that is the way the code _reads_, it isn't the way it _behaves_! 

As I've already mentioned, the `default` literal infers the type from the value returned by the other branch of the ternary conditional, which in this case is `DateTimeOffset.UtcNow.AddDays(7)`.

This is not a _nullable_ `DateTimeOffset?`, but a basic `DateTimeOffset`: the default of which is `DateTimeOffset.MinValue`.

So... if the user _doesn't_ check "Remember Me", my code sets `ExpiresUtc` to `01/01/0001 00:00:00 +00:00`. This means that the auth cookie is _immediately_ expired, and—even though their login was actually successful—the user is redirected straight back to the login page.

## The right way

The _correct_ way to do this is to use a [default value expression](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/default), specifying the type:

    :::csharp{AuthenticationProperties}
    var authenticationProperties = new AuthenticationProperties {
        IsPersistent = model.RememberMe,
        ExpiresUtc = model.RememberMe 
            ? DateTimeOffset.UtcNow.AddDays(7) 
            : default(DateTimeOffset?)
    };

Now we're defaulting to a `DateTimeOffset?` value, which means the default is actually `null`... not an offset value thousands of years in the past. 😉

This was _incredibly_ frustrating to debug, so I thought I'd write about it in case it helps anyone else with a similar issue. Happy coding!

<small>*Does anyone know _which_ version of C# they were introduced in? If you do, please get in touch!</small>