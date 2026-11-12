# CraftPix Art Integration Implementation Plan

> **For agentic workers:** Native inline implementation, with automated verification through the repository's GitHub Actions workflow.

**Goal:** Replace the prototype grid fills, letter towers, and generated placeholder zombies with a coherent CraftPix-based battlefield, tower sprites, and animated zombie sprites while preserving gameplay rules.

**Architecture:** Phaser Preload loads a single atlas plus a precomposed battlefield and library image. A typed asset manifest maps the existing six tower types and seven zombie types to atlas frame sequences. GameScene remains a renderer adapter; simulation, grid coordinates, questions, economy, waves, and save data do not change.

**Tech Stack:** Phaser 3.90.0, TypeScript strict, Vite, WebP, Phaser Atlas JSON, Node test runner.

**Spec:** User-approved choice of Archer Towers + Fields Tileset + Urban Zombie packs (2026-11-12).

## Global Constraints

- Keep Phaser 3.90.0, TypeScript strict mode, Vite, and GitHub Pages base path unchanged.
- Preserve existing GridSystem dimensions (13×8, 58 px cells) and GameSimulation behavior.
- Support six existing tower types and seven existing zombie types without changing game balance.
- Use only selected CraftPix artwork and the composed custom library icon; do not publish original source archives or PSDs.
- Keep the Thai question bank and all learning UI behavior unchanged.

## Review Focus

- Every tower role resolves to an existing idle frame and four upgrade frames.
- Every zombie role resolves to idle, walk, attack, hurt, and dead frames.
- Sprite anchors and scale keep units legible within 58 px lanes on narrow screens.
- Missing/invalid atlas frames should fail the asset test instead of silently showing blank sprites.
- Death and hurt animations must not leave stale labels or zombie sprites behind.

## Files

- Create: `src/assets/gameArt.ts` — typed mappings, frame counts, frame-key helpers, animation registration.
- Create: `src/assets/art/game-atlas.webp`, `src/assets/art/game-atlas.json`, `src/assets/art/battlefield.webp`, `src/assets/art/school-library.webp`.
- Modify: `src/scenes/BootScene.ts`, `src/scenes/PreloadScene.ts`, `src/scenes/GameScene.ts`.
- Create: `tests/game-art.test.ts`.
- Modify: `README.md`, `CREDITS.md`.

## Tasks

1. Add failing tests for complete tower/zombie mappings and exact atlas frame availability; run the tests and observe the missing art manifest failure.
2. Add typed art manifest and animation registration; verify the atlas frame tests pass.
3. Load the atlas and images in PreloadScene; replace placeholder GameScene ground/tower/zombie rendering with CraftPix sprites while leaving simulation and touch/keyboard input unchanged.
4. Update art documentation and credits; run typecheck, all tests, ESLint, question validation, and Vite production build through GitHub Actions; deploy only after all checks pass.
