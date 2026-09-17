# Plinko Reveal

Plinko Reveal is a browser-based Plinko game where each falling ball reveals part of a hidden image. Players begin with 1,000 points and try to reveal the target percentage of the image while bucket results reduce their remaining points.

## Current features

- Multiple configurable Plinko board presets
- Physics-based ball drops and peg collisions
- Hidden, randomized point-cost buckets
- Image reveal paths created by falling balls
- URL and local-file image loading
- Image scale, position, and reveal-radius controls
- Importable/exportable JSON board configuration
- Recording-friendly layout with collapsible setup controls

## Running locally

No build step is required. Open `index.html` in a modern web browser.

## Project structure

- `index.html` — page structure
- `css/style.css` — visual styling and responsive layout
- `js/game.js` — game logic, physics, rendering, and configuration

## AI tools

ChatGPT was used as an AI coding assistant during development.

## Open-Source Reference

This project was developed with reference to HTMLPlinko by Trent Pierce:

https://github.com/TrentPierce/HTMLPlinko

HTMLPlinko is an open-source browser-based Plinko game built with HTML,
CSS, and JavaScript. It provides a comparable example of a browser-based
Plinko game with ball physics, peg collisions, and prize slots.

Plinko Reveal is a separate implementation and does not copy the
reference project's source code. It expands on the basic Plinko concept
with an image-reveal mechanic, hidden randomized point-cost buckets,
multiple board configurations, image positioning controls, and
importable/exportable configuration data.

## AI Tools

ChatGPT was used as an AI coding assistant during development, including
assistance with JavaScript game logic, HTML/CSS layout, debugging, and
project organization.