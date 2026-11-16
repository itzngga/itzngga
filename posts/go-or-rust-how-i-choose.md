---
title: "Go or Rust: how I choose"
date: 2026-11-16
description: Both are great languages. Here is the simple rule I use to pick one for each part of a project.
tags: Go, Rust
image_alt: A road splitting in two between tall trees
image_credit: Jens Lelie
image_url: https://unsplash.com/photos/two-roads-between-trees-u0vgcIOQG08
---

Most of my backend code is Go or Rust. People often ask which one is better. My answer: it depends on the job, and the choice is usually quick.

## When I pick Go

- The work is mostly waiting on the network: APIs, bots, webhooks, small workers.
- I want to ship fast and keep the code easy for anyone to read.
- The standard library already covers most of it: HTTP, JSON, testing.

My WhatsApp bot framework, [Roxy](https://github.com/itzngga/Roxy), is written in Go for exactly these reasons.

## When I pick Rust

- Speed and memory matter on every request, like in a proxy or a web server layer.
- I want the compiler to catch mistakes in concurrent code before users do.
- The program runs for months and has to stay steady under load.

## The quick test

Ask one question: is this limited by my time, or by the machine's time? If it's mine, Go. If it's the machine's, Rust.

## Use both

Some of my projects use both: Go for the app and its APIs, Rust where every millisecond counts. Pick per part, not per project.
