Title: IntelliJ IDEA: Fixing "Permission denied: connect" Errors
Abstract: An issue with some older Cisco VPN client software means IntelliJ IDEA will throw connection exceptions when trying to perform online actions. Here's how to fix it.
Published: 2012-12-21 13:37
Updated: 2012-12-21 13:37

I'm making my first tentative steps with [Scala](http://www.scala-lang.org/ "External Link: Scala"), and according to many sources (including Mikio Braun's excellent [getting started article](http://blog.mikiobraun.de/2011/04/getting-started-in-scala.html "External Link: Getting Started In Scala")), the IDE of choice is [IntelliJ IDEA](http://www.jetbrains.com/idea/ "External Link: IntelliJ IDEA").

However, having downloaded and installed the Community Edition, I found I was unable to install the Scala plugin; when I clicked the `Browse Repositories` button under the Plugins dialog, IDEA threw up a `Permission denied: connect`
exception.

It turns out that this is due to an issue with Java 7 (which brings IPV6 support) and the Cisco AnyConnect VPN client I have installed (which seemingly doesn't support IPV6 sockets, [see here](http://www.java.net/node/703177 "External Link: JDK7 Permission Denied with Sockets when using VPN (Java Support)")).

The obvious workaround is to close the VPN client, but as I need this constantly it wasn't really practical. There is also an update to the client which may well fix the issue, but as we don't have access to download it due to Cisco's support system, the other way around this is as follows:

 1. Open the IntelliJ IDEA `bin` folder—in my case, `C:\Program Files (x86)\JetBrains\IntelliJ IDEA Community Edition 12.0.1\bin`
 2. Open the `idea.exe.vmoptions` and `idea64.exe.vmoptions` files
 3. Add `-Djava.net.preferIPv4Stack=true` on a new line at the end of each file
 4. Save the files and restart IntelliJ IDEA

You should now find IDEA can connect to online endpoints successfully.
