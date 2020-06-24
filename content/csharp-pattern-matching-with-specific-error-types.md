Title: Handling errors with specific error types and C# pattern matching
Abstract: Improve your application's error handling by creating specific types for error cases.
Published: 2020-06-22 07:57
Updated: 2020-06-22 07:57

Error handling is one of the boring-but-necessary aspects of development. It's often an afterthought—"_I'll just wrap this in a try/catch and log it_"— but a little extra effort can make your applications much more robust.

First, it's important to understand that **errors** and **exceptions** are distinct concepts.

**Exceptions** should really only be thrown when the situation is... exceptional. An exception tells us that the system is in an unexpected state: one which we assumed was impossible. A good example is that old favourite, the null reference exception. This is thrown when we access a property of an object reference, assuming it exists... but the reference doesn't point to an object. 

**Errors** represent things which could go wrong during the normal operation of a system. We _expect_ them to occur, and when they do we handle them accordingly. Entering invalid address data during checkout when shopping online is one example. This will happen often, so we need to handle it and update the UI to help the customer correct the problem.

When I design a system, I like to create a specific C# type to represent each potential error case. This forces me to think harder about what actually _could_ go wrong, and the resulting code is generally better for it.

Another advantage of doing this is that it makes it a lot easier to handle each error case. The error classes can contain information _specific_ to the problem that has occurred. This makes the consuming code less complex, because you don't have to parse irrelevant data to get at what you need.

Let's look at a simplified example, adapted from some real-world code which validates gift voucher redemptions. 

First, we create a general base `Error` type:

    :::csharp
    public abstract class Error
    {
        public Error(string description) =>
            Description = description;

        public string Description { get; }
    }

_All_ errors in the application can derive from this base type.

For any error relating to a voucher, we'll probably want to know the voucher code. So we get a little more specific:

    :::csharp{Error}
    public abstract class VoucherError : Error
    {
        public VoucherError(string code, string description) 
            : base(description) => Code = code;
        
        public string Code { get; }
    }

Now we can model our specific error cases:

    :::csharp{VoucherError}
    public class ZeroOrderTotalError : VoucherError 
    {
        public ZeroOrderTotalError(string code) 
            : base(code, "Cannot redeem voucher against a cart with zero total.") {}
    }

    public class ZeroBalanceError : VoucherError 
    {
        public ZeroBalanceError(string code) 
            : base(code, $"Voucher has a remaining balance of 0.") {}
    }

    public class InvalidRedemptionAmountError : VoucherError 
    {
        public InvalidRedemptionAmountError(string code, decimal redemptionAmount)
            : base(code, $"Redemption amount must be greater than zero (was {redemptionAmount}).") =>
            RedemptionAmount = redemptionAmount;

        public decimal RedemptionAmount { get; }
    }

    public class InsufficientBalanceError : VoucherError 
    {
        public InsufficientBalanceError(
            string code, 
            decimal redemptionAmount, 
            decimal balance)
            : base(code, $"Voucher balance ({balance:0.00}) is less than redemption amount ({redemptionAmount:0.00}).")
        {
            RedemptionAmount = redemptionAmount;
            Balance = balance;
        }

        public decimal RedemptionAmount { get; }

        public decimal Balance { get; }
    }

Note that these all derive from `VoucherError`.

Now we've modelled our errors, we can use them in our code. This validation function returns a [tuple](https://docs.microsoft.com/en-us/dotnet/csharp/tuples) which tells the caller if the action is valid, and if not, what the error was.

    :::csharp{Cart|Voucher|VoucherError|ZeroOrderTotalError|InvalidRedemptionAmountError|ZeroBalanceError|InsufficientBalanceError}
    public static (bool canBeApplied, VoucherError error) ValidateVoucherRedemption(
        Voucher voucher, 
        Cart cart,
        decimal amountToRedeem)
    {
        /* 
        Guard clauses are a sensible use of exceptions.
        
        Our logic assumes that all arguments are non-null references, so if 
        they *are* null, it's either programmmer error, or something is wrong 
        in the consuming code. Either way, we want to fail immediately.
        */
        
        if (cart is null)
        {
            throw new ArgumentNullException(nameof(cart));
        }

        if (voucher is null)
        {
            throw new ArgumentNullException(nameof(voucher));
        }
        
        if (cart.Total <= 0)
        {
            // Cart doesn't have any items (or they're all free)
            return (false, new ZeroOrderTotalError(voucher.Code));
        }

        if (amountToRedeem <= 0)
        {
            // The customer is attempting to redeem a zero or negative value
            return (false, new InvalidRedemptionAmountError(voucher.Code, amountToRedeem));
        }

        if (voucher.Balance == 0)
        {
            // The voucher has been fully redeemed already
            return (false, new ZeroBalanceError(voucher.Code));
        }
        
        if (voucher.Balance < amountToRedeem)
        {
            // The remaining voucher balance doesn't cover the redemption amount
            return (false, new InsufficientBalanceError(voucher.Code, amountToRedeem, voucher.Balance));
        }

        return (true, default);
    }

Often, the error messages you want to show to users will be different to those you want as a developer. Because we have all the information, this is now trivial using C# pattern matching:

    :::csharp{VoucherError|ZeroOrderTotalError|InvalidRedemptionAmountError|ZeroBalanceError|InsufficientBalanceError}
    public static string GetCustomerVoucherErrorMessage(VoucherError error)
    {
        switch (error)
        {
            case ZeroBalanceError e:
                return $"Sorry, your voucher ({e.Code}) has no remaining balance.";
            case InsufficientBalanceError e:
                return $"Sorry, your voucher ({e.Code}) only has a remaining balance of {e.Balance:0.00}.";
            case InvalidRedemptionAmountError e:
                return "The amount you redeem must be greater than zero.";
            case ZeroOrderTotalError e:
                return "This cart is free: save your voucher for your next order!";
            default:
                throw new Exception($"Unknown voucher error: {error.GetType().Name}");
        }
    }

Here's how we'd use this in, for example, an ASP.NET action method:

    :::csharp{HttpPost|IActionResult|RedeemVoucherViewModel}
    [HttpPost]
    public IActionResult RedeemVoucher(string code, decimal amount)
    {
        // Imagine there is code to get voucher and cart data below

        ... 

        var (valid, error) = ValidateVoucherRedemption(voucher, cart, amount);

        if (!valid)
        {
            // Log the raw error, containing information for developers
            LogError(error);

            var viewModel = new RedeemVoucherViewModel {
                ErrorMessage = GetCustomerVoucherErrorMessage(error)
            };

            // Show the customer a response with the friendly error messaging
            return View(viewModel);
        }

        return RedirectToAction("Cart");
    }
