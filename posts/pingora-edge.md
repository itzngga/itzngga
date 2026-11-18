---
title: "pingora-edge: a small edge proxy in Rust"
date: 2026-11-18
description: I published pingora-edge, a Rust proxy that handles HTTPS for many sites. Here is what it does and the ideas behind it.
tags: Rust, Pingora, Open source
image_alt: Long-exposure light trails on a highway at night
image_credit: Cris Ovalle
image_url: https://unsplash.com/photos/time-lapse-photography-of-lighted-road-at-night-YTk8tO3PGdA
---

I just published a project I enjoyed building: [pingora-edge](https://github.com/itzngga/pingora-edge), a small edge proxy written in Rust. It sits at the front, takes HTTPS traffic for many hostnames and sends each request where it belongs.

It is built on [Pingora](https://github.com/cloudflare/pingora), the Rust proxy framework from Cloudflare, with BoringSSL for TLS. It runs in production. It's not perfect, but it holds up, and a few ideas in it are worth sharing.

## What it does

- Acts as a reverse proxy, serves static files or redirects, chosen per route.
- Gets free certificates through ACME (Let's Encrypt or ZeroSSL) and renews them.
- Adds rate limits, a penalty box, a circuit breaker and Prometheus metrics.

## Three ideas I like

**Stop bad traffic before TLS.** A TLS handshake costs real CPU. So a small Tokio listener reads each ClientHello first and drops junk, floods and repeat offenders before any TLS state exists. Real visitors go straight through.

**Certificates on demand.** Hostnames listed in a text file get a certificate the first time someone visits. A visitor waits at most 800 ms for it, then gets a temporary certificate while the real one finishes. Names that are not on the list never trigger an order.

**Reload all or nothing.** A new config is checked first, then applied as a whole or not at all, so a request never sees half of the old config and half of the new one. A `--check` command lets you test a file before you ship it.

## Try it

The [docs](https://itzngga.github.io/pingora-edge/) have a short guide for each part, and a local playground that needs no domain and no certificate authority:

```bash
git clone https://github.com/itzngga/pingora-edge
cd pingora-edge
cargo build --release
```

Then follow the [getting started guide](https://itzngga.github.io/pingora-edge/getting-started.html). The [abuse defence page](https://itzngga.github.io/pingora-edge/abuse-defence.html) explains the layers in the order a connection meets them.

## Honest limits

- HTTP-01 only, so no wildcard certificates.
- One upstream per route, and no load balancing across several backends.
- Built for Linux first, and the code has not been audited.

So review it before you put it in front of your own site. If you try it or spot a bug, open an issue. I would love to hear what you think.
