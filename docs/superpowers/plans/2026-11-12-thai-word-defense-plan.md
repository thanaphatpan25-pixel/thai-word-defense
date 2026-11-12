# Implementation Plan: Thai Word Defense

## Global constraints
- Phaser 3.90.0 + Vite + TypeScript strict; HTML DOM overlays; static hosting.
- No externally sourced art/audio; procedural pixel sprites; Thai content split into 10 JSON files with at least 30 questions each.
- Simulation rules stay outside Phaser scenes; save only serializable domain state.
- Validate builds, typecheck, tests, lint, and a browser smoke test where tooling allows.

## File map
- `src/data`: typed question schema, ten JSON banks, tower/zombie/balance/wave/card data.
- `src/entities`: serializable tower/zombie/projectile domain entities and pooling.
- `src/systems`: deterministic question, economy, wave, combat, save, audio and simulation rules.
- `src/scenes`: Boot, Preload, Menu, Game, UI, GameOver, Settings scenes.
- `src/ui`: DOM menus, HUD, question panel, teacher settings, results and dialogs.
- `src/utils`: seeded RNG, dates, formatting and pixel-art texture generation.
- `tests`: domain tests for question selection/repetition, economy, wave scaling and placement.
- `.github/workflows/deploy.yml`: Pages build and deploy.

## Tasks
1. Scaffold the project and install pinned runtime/dev dependencies. Add scripts, strict TS, ESLint, Prettier, Vite base path and workflow.
   - Verify `npm run typecheck`, `npm run lint`.
2. Add domain tests first, then implement question/economy/wave/pool/save/placement systems.
   - Verify `npm test` with red-green cycles and `npm run typecheck`.
3. Add 10 static question JSON banks (30+ each) and validate their schema/counts/answers.
   - Verify `npm run validate:questions`.
4. Build procedural pixel art and Phaser scenes; wire grid placement, waves, towers, zombies, projectiles and boss behavior.
   - Verify `npm run build` and a manual play smoke test.
5. Add responsive DOM UI, learning feedback, practice, daily mode, teacher tools, upgrades, achievements and save UX.
   - Verify tests/build/lint and mobile layout.
6. Complete README, credits, license and test report; create zip and Git history.
   - Verify all scripts and inspect final tree. Publish to GitHub only through an authenticated GitHub action; do not claim publish unless remote confirms it.

## Review focus
- Thai question answer keys and explanations must match the choices; TODO tags are visible for uncertain curriculum nuance.
- Placement and path collision must not allow towers on the enemy route.
- Wave progression must be endless and boss cadence exact.
- Save data must be versioned and tolerate malformed storage.
- UI keyboard/touch actions must not double-answer or place towers while a modal is open.
