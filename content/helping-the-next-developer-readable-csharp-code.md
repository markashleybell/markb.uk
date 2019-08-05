Title: Helping The Next Developer: Readable C#
Abstract: A few tips for writing C# code which explains itself clearly.
Published: 2016-09-26 17:00
Updated: 2016-09-26 17:00

I'd like to share a few tips for writing concise, readable C#. It's worth keeping them in mind if you want to make things easier for anyone maintaining your code.

## White space and indentation

Indentation and white space help the reader to parse related code blocks, so *keep them consistent*. Mismatched indentation can make your code much trickier to understand.

## Reduce line length

Shorter lines are more readable.

See what I did there? You can indent fluent interface calls (e.g. LINQ extension methods) to make them a lot easier to scan:

    :::csharp
    var resultList = items
        .SelectMany(x => x.IntArray)
        .Select(x => x[1])
        .Distinct()
        .ToList();

Another common culprit when it comes to lengthy lines is the ternary expression. I find it helpful to break long expressions onto multiple lines:

    :::csharp
    var intVar = myVal == 1
        ? Convert.ToInt32(longVariableName.GetValue())
        : new DynamicConfiguration(myVal).GetValue();

In the case above, it might even be clearer to rewrite using `if`/`else`.

## Use implicitly typed variables where possible

Use of the `var` keyword reduces noise. There's no need for this:

    :::csharp
    RatherLengthyClassName myObject = new RatherLengthyClassName();

When you can do this, with no loss of clarity:

    :::csharp
    var myObject = new RatherLengthyClassName();

The exception to this rule is when it isn't clear what the type will be from the assignment:

    :::csharp
    Animal dog = GetThing(true);

This contrived example contains a deliberately terrible method name, but I'm sure we've all seen similar code in real codebases…

## Named arguments

I'm sure you'll also have seen code like this:

    :::csharp
    var myObject1 = new ComplicatedThing(true, 3, true, false, true);

    myObject2.PerformAction(Action.Update, 12, "Joe Bloggs", true);

What do all of those parameter values represent?

There is [an argument for not using boolean flags as method parameters at all](https://medium.com/@amlcurran/clean-code-the-curse-of-a-boolean-parameter-c237a830b7a3), but in the real world we're often using APIs we didn't write, or consuming legacy code which can't easily be rewritten.

By using named method arguments, we can make things much clearer:

    :::csharp
    var myObject1 = new ComplicatedThing(
        loadChildren: true,
        maxDepth: 3,
        loadImages: true,
        allowUpdates: false,
        lockDeletion: true
    );

    myObject2.PerformAction(
        action: Action.Update,
        id: 12,
        name: "Joe Bloggs",
        subscribe: true
    );

You don't *have* to specify the name of every parameter, so you can omit them where the meaning is obvious:

    :::csharp
    myObject3.AddNewItem(itemData, redirect: true);

## Commenting: remember “WHY, not WHAT”

As a general rule of thumb, don't use comments to describe *what* a piece of code does. If you can't tell this by reading the code, you should figure out a simpler approach.

Add comments when you want to explain *why* you did something. That way, maintainers won't have to spend time trying to figure out what you were thinking when you wrote it.

## Remove old code

*Don't* just comment out old code and leave it there “just in case”. Having to scan large blocks of commented-out code increases cognitive load for future readers. It also makes searching the code less effective, because searches often return matches which are within commented blocks.

If code is no longer used, *delete it and make a commit explaining why you did so*. If you later discover you need it after all, retrieve it from your version control system—that's what it's for!
