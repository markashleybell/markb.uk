Title: Creating a simple Stopwatch/Timer application with C# and Windows Forms
Abstract: A basic pattern for creating a stopwatch/timer application in C#, which is slightly trickier than it sounds…
Published: 2011-02-04 09:26
Updated: 2011-02-04 09:26

While working on a project today, I came across the need for a simple stopwatch/timer which would keep track of the total elapsed time until it was reset. It turned out to be a little trickier than I first assumed, so I've posted my code here for the convenience of anyone else who needs to do the same thing.

    :::csharp
    using System;
    using System.Windows.Forms;

    namespace StopwatchSpike
    {
        public partial class StopwatchSpikeForm : Form
        {
            // Because we have not specified a namespace, this
            // will be a System.Windows.Forms.Timer instance
            private Timer _timer;

            private DateTime _startTime = DateTime.MinValue;
            private TimeSpan _currentElapsedTime = TimeSpan.Zero;
            private TimeSpan _totalElapsedTime = TimeSpan.Zero;

            private bool _timerRunning = false;

            public StopwatchSpikeForm()
            {
                InitializeComponent();

                // Set up a timer and fire the Tick event every second (1000 ms)
                _timer = new Timer();
                _timer.Interval = 1000;
                _timer.Tick += new EventHandler(_timer_Tick);
            }

            /// <summary>
            /// Handle the Timer's Tick event
            /// </summary>
            /// <param name="sender">System.Windows.Forms.Timer instance</param>
            /// <param name="e">EventArgs object</param>
            void _timer_Tick(object sender, EventArgs e)
            {
                // We do this to 'chop off' any stray milliseconds
                // resulting from the Timer's inherent inaccuracy,
                // with the bonus that the TimeSpan.ToString() method
                // will now show the correct HH:MM:SS format
                var timeSinceStartTime = DateTime.Now - _startTime;
                timeSinceStartTime = new TimeSpan(timeSinceStartTime.Hours,
                                                  timeSinceStartTime.Minutes,
                                                  timeSinceStartTime.Seconds);

                // The current elapsed time is the time since the start button
                // was clicked, plus the total time elapsed since the last reset
                _currentElapsedTime = timeSinceStartTime + _totalElapsedTime;

                // These are just two Label controls which display the current
                // elapsed time and total elapsed time
                _totalElapsedTimeDisplay.Text = _currentElapsedTime.ToString();
                _currentElapsedTimeDisplay.Text = timeSinceStartTime.ToString();
            }

            /// <summary>
            /// Handle Start/Stop button click
            /// </summary>
            /// <param name="sender">The Button control</param>
            /// <param name="e">EventArgs object</param>
            private void startButton_Click(object sender, EventArgs e)
            {
                // If the timer isn't already running
                if (!_timerRunning)
                {
                    // Set the start time to Now
                    _startTime = DateTime.Now;

                    // Store the total elapsed time so far
                    _totalElapsedTime = _currentElapsedTime;

                    _timer.Start();
                    _timerRunning = true;
                }
                else // If the timer is already running
                {
                    _timer.Stop();
                    _timerRunning = false;
                }
            }

            /// <summary>
            /// Handle Reset button click
            /// </summary>
            /// <param name="sender">The Button control</param>
            /// <param name="e">EventArgs object</param>
            private void resetButton_Click(object sender, EventArgs e)
            {
                // Stop and reset the timer if it was running
                _timer.Stop();
                _timerRunning = false;

                // Reset the elapsed time TimeSpan objects
                _totalElapsedTime = TimeSpan.Zero;
                _currentElapsedTime = TimeSpan.Zero;
            }
        }
    }

Because I wasn't interested in sub-second accuracy, I've used `System.Windows.Forms.Timer` for simplicity, but the principle is the same whichever timer class you use.

If you want to find out more about the differences between `System.Threading.Timer`, `System.Windows.Forms.Timer` and `System.Timers.Timer`, it's definitely worth reading [this article comparing the Timer classes in the .NET Framework class library](http://msdn.microsoft.com/en-us/magazine/cc164015.aspx "External Link: Comparing the Timer Classes in the .NET Framework Class Library (MSDN)").

You can [view the full source here](https://github.com/markashleybell/mab_stopwatch_spike "External Link: Stopwatch Spike Github Repository") and [download a complete working VS2010 Solution here](https://github.com/markashleybell/mab_stopwatch_spike/archive/1.0.zip "External Link: Stopwatch Spike Source Download").