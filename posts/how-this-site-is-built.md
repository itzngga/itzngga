---
title: How this site is built
date: 2026-11-16
description: A small static site and blog on Cloudflare, with a cheap .my.id domain and no server to look after.
tags: Cloudflare, Web
image_alt: A monitor showing HTML code in a dark editor
image_credit: Pankaj Patel
image_url: https://unsplash.com/photos/monitor-displaying-indexhtml-codes-_SgRNwAVNKw
---

This site is one page, one stylesheet and a small blog. There is no server for me to look after, and the hosting is free.

## The setup

- **Hosting:** Cloudflare serves the files from my GitHub repository. A push goes live in under a minute.
- **Domain:** `ranggash.my.id`. A `.my.id` domain is cheap and fits a personal site.
- **HTTPS:** Cloudflare handles the certificate and moves plain HTTP visitors to HTTPS.
- **Blog:** each post is a Markdown file. A short script turns the posts into pages, a feed and a sitemap.

## Why so small

A static site loads fast, has nothing to patch and very little that can break. Adding something new means adding a file and pushing.

## Search engines

Every page has a clear title, a short description and structured data. A sitemap and a `robots.txt` help search engines find the rest.

The source is on [GitHub](https://github.com/itzngga/itzngga).
