---
title: "Tokio tuning: the basics that matter"
date: 2026-11-16
description: Five simple habits that keep async Rust services fast and steady under load.
tags: Rust, Tokio, Performance
image_alt: Blue network cables plugged into a server rack
image_credit: Taylor Vick
image_url: https://unsplash.com/photos/cable-network-M5tzZtFCOfs
---

Most Tokio services don't need clever tuning. They need a few good habits. These are the ones I start with.

## 1. Never block the runtime

A blocking call inside an async task stalls every other task on that worker thread. Move heavy CPU work and blocking I/O off the runtime:

```rust
let hash = tokio::task::spawn_blocking(move || expensive_hash(&data))
    .await?;
```

## 2. Put a timeout on everything

A slow client or upstream should never hold resources forever.

```rust
use std::time::Duration;
use tokio::time::timeout;

match timeout(Duration::from_secs(5), fetch(url)).await {
    Ok(body) => handle(body),
    Err(_) => report_slow(url),
}
```

## 3. Limit how much runs at once

Unlimited concurrency feels fast until a traffic spike eats all the memory. A semaphore keeps it in check:

```rust
use std::sync::Arc;
use tokio::sync::Semaphore;

let limit = Arc::new(Semaphore::new(256));
loop {
    let (socket, _) = listener.accept().await?;
    let permit = limit.clone().acquire_owned().await?;
    tokio::spawn(async move {
        handle(socket).await;
        drop(permit);
    });
}
```

Bounded channels work the same way: when the queue is full, the sender waits instead of piling up work.

## 4. Size the runtime on purpose

The multi-thread runtime starts one worker per CPU core by default. That's a good start, but in containers, check that it matches the CPU the process can really use:

```rust
let runtime = tokio::runtime::Builder::new_multi_thread()
    .worker_threads(4)
    .enable_all()
    .build()?;
```

## 5. Measure before you tune

Guessing wastes time. Add `tracing` spans around slow paths, watch latency percentiles, and change one thing at a time. `tokio-console` shows which tasks are busy or stuck.

A faster allocator like mimalloc can also help busy services. Measure that too.
