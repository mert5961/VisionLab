# VisionLab

VisionLab is an interactive computer vision learning game built with React, TypeScript, and Vite. It turns image-processing concepts into a mission-based interface where the player repairs a broken vision pipeline, inspects the signal at each stage, and learns how preprocessing affects detection.

The current experience focuses on a "Find the Shape" chapter: players move between a mission screen and an operator workspace, debug pipeline steps, compare source and processed frames, and use diagnostics to recover the target contour.

## Highlights

- Mission-based progression with unlockable levels
- Interactive pipeline editor with reorder, toggle, and parameter controls
- Live visual feedback for input, processed output, and overlay states
- Built-in diagnostics panel for failure states and guidance
- Related lesson links that connect gameplay to real CV coursework
- Worker-based analysis pipeline for responsive UI updates

## Tech Stack

- React 19
- TypeScript
- Vite
- CSS with a custom sci-fi interface theme
- Web Workers for analysis processing

## Getting Started

### Prerequisites

- Node.js 24.15+ recommended (also supports 22.22.2+ or 26+)
- npm

### Install

```bash
npm ci
```

### Start the dev server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Run all checks

```bash
npm run check
```

This runs lint, regression tests, and a production build. `npm test` runs tests alone.
Tests use a Skia canvas renderer to exercise real image pixels, including each of
the 12 levels at its original seed and two rescan seeds. Hook and UI tests cover
worker failures, stale replies, mission selection, and saved progress.

## Progress and diagnostics

The mission sequence begins with Raw Feed and unlocks all 12 implemented levels.
Completed levels are saved automatically in this browser, including when you
restore a solved pipeline. Pipeline edits and the current scan are session-only.
If browser storage is blocked or full, the game continues with session progress.

Add `?debug=1` to enable gameplay and layout diagnostics. These checks are skipped
in normal play. If a Web Worker fails or does not respond within 10 seconds,
analysis falls back to the main thread so the editor can keep working.

## Deployment

This project is configured for GitHub Pages with a GitHub Actions workflow.

- Production URL: [VisionLab on GitHub Pages](https://mert5961.github.io/VisionLab/)
- Vite base path: `/VisionLab/`
- Workflow file: `.github/workflows/deploy-pages.yml`

Pull requests and feature branches run lint, tests, and the production build.
After pushing to `main`, GitHub Actions runs the same checks before deploying the
`dist` output to Pages. CI uses Node.js 24.

In the repository settings, make sure GitHub Pages is set to use `GitHub Actions` as the source if it is not already.

## Project Structure

```text
src/
  components/   UI building blocks for the mission and operator screens
  cv/           analysis pipeline, worker, and vision types
  game/         mission and level catalog logic
  modules/      learning modules and chapter content
  qa/           gameplay and UI validation helpers
```

## Current Module

The first module, `find-the-shape`, teaches players how a detection pipeline is assembled:

- convert raw image data into a useful mono signal
- tune blur, threshold, and edge stages
- extract contours
- select the correct target from noisy candidates

This is framed as a repair workflow so the player learns by fixing incorrect steps rather than reading a static explanation.

## Vision

VisionLab is designed to make computer vision feel tactile. Instead of hiding the pipeline behind a single prediction, the interface exposes each transformation so learners can see how the machine "sees" and why a result succeeds or fails.
