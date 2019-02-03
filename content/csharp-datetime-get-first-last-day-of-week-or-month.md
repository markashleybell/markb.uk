Title: Getting the first and last day of a week or month with C#
Abstract: Extension methods for determining the first and last day of the week or month a specific date is within.
Published: 2015-02-02 18:12
Updated: 2015-02-02 18:12

I recently found myself needing to get the date of the first day of a particular week in C#. After browsing [this rather confusing collection of answers](http://stackoverflow.com/questions/38039/how-can-i-get-the-datetime-for-the-start-of-the-week "External Link: Stack Overflow"), I pieced together parts of various code snippets into this little collection of utility methods.

    :::csharp
    public static partial class DateTimeExtensions
    {
        public static DateTime FirstDayOfWeek(this DateTime dt)
        {
            var culture = System.Threading.Thread.CurrentThread.CurrentCulture;
            var diff = dt.DayOfWeek - culture.DateTimeFormat.FirstDayOfWeek;
            if(diff < 0)
                diff += 7;
            return dt.AddDays(-diff).Date;
        }

        public static DateTime LastDayOfWeek(this DateTime dt)
        {
            return dt.FirstDayOfWeek().AddDays(6);
        }

        public static DateTime FirstDayOfMonth(this DateTime dt)
        {
            return new DateTime(dt.Year, dt.Month, 1);
        }

        public static DateTime LastDayOfMonth(this DateTime dt)
        {
            return dt.FirstDayOfMonth().AddMonths(1).AddDays(-1);
        }

        public static DateTime FirstDayOfNextMonth(this DateTime dt)
        {
            return dt.FirstDayOfMonth().AddMonths(1);
        }
    }

The `FirstDayOfWeek` method is culture-sensitive, so in the `en-GB` culture the first day will be a Monday, whereas in the `en-US` culture it will be a Sunday. Given that, you can now easily get month and week boundaries for any given `DateTime`:

    :::csharp
    var firstdayOfThisWeek = DateTime.Now.FirstDayOfWeek();

Hopefully someone else out there will find these useful!
