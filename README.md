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

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
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
