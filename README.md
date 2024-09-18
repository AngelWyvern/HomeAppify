# HomeAppify

HomeAppify lets you create a temporary DNS proxy server, allowing you to make standalone web apps of any website!

## How it works

HomeAppify creates both HTTP/HTTPS servers and a DNS server upon launching. This DNS server will redirect all domain names back to your host's local IP address. Effectively, this makes all websites (accessed through a domain name) reroute to our web servers.

The web servers provides a manifest.json file (containing our home app configuration), app icons (if provided), and a basic HTML file pointing to these resources.

## Quick start

### Setting up dependencies

Run the following command from a shell environment (terminal). If you are running Windows, download and install [GitForWindows](https://gitforwindows.org/) first, then run the following in Git Bash.

```sh
./gencert.sh
```

This will generate a self-signed certificate for you to properly host an HTTPS server.

Next, install the latest version of [Bun](https://bun.sh) if you don't already have it, then run the following.

```sh
bun install
```

This should install all of the required node modules for the project.

### Modifying the back-end config

A parameter has to be changed in the server configuration before we can run HomeAppify.

Open `srvconfig.json`, and head to the `reroute` field under `dns`. You'll have to change the value of this field to the local IP address of your host machine. This can be found by opening a terminal and running `ipconfig /all` (Windows) or either `ip addr` or `hostname -I` (Linux).

### Running HomeAppify

You can run HomeAppify by running the following in a terminal.

```sh
bun .
```

The process can be terminated at any time by pressing `Ctrl+C` in your terminal.

## In summary

A host launches HomeAppify, configures the home app from the GUI, and a client connects to the host's DNS server. The client will open their website of choice within their browser, and install the webapp. Once this has been done, the client will disconnect from the DNS server, and now have a standalone webapp shortcut on their home screen.

###### This project was created using `bun init` in bun v1.1.27. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.