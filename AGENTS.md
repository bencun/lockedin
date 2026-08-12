# Repository Guidelines

## Project Structure & Module Organization

This repository contains a WXT browser extension (https://wxt.dev/) built with React and TypeScript. Browser entry points live in `entrypoints/`: `background.ts` handles background behavior, `content.ts` runs on matched pages, and `popup/` contains the React popup UI and styles. Put bundled images in `assets/`; place files that must be copied unchanged into the extension package in `public/` (for example, `public/icon/`). WXT configuration belongs in `wxt.config.ts`. Treat `.wxt/` and `.output/` as generated directories and do not edit or commit their contents.

## Build, Test, and Development Commands

Use pnpm, as recorded by `pnpm-lock.yaml`.

- `pnpm install` installs dependencies and runs `wxt prepare`.
- `pnpm dev` launches a Chromium development build with hot reload.
- `pnpm dev:firefox` launches the Firefox development build.
- `pnpm compile` runs TypeScript checks without emitting files.
- `pnpm build` and `pnpm build:firefox` create production builds.
- `pnpm zip` and `pnpm zip:firefox` package store-ready archives.

Before submitting a change, run `pnpm compile` and the relevant production build.

## Coding Style & Naming Conventions

Use TypeScript/TSX with two-space indentation and let Prettier handle formatting; the workspace enables format-on-save with `esbenp.prettier-vscode`. Name React components in PascalCase (`App.tsx`), functions and variables in camelCase, and CSS classes in kebab-case. Keep WXT entry-point filenames conventional (`background.ts`, `content.ts`, `popup/`). Prefer focused components and keep entry-point setup separate from reusable UI or domain logic.

## Testing Guidelines

No automated test framework or coverage threshold is configured yet. Validate every change with `pnpm compile`, then load the generated extension and exercise the affected flow in Chromium; repeat in Firefox for browser-sensitive work. When adding tests, colocate them as `*.test.ts` or `*.test.tsx` and add the runner command to `package.json`.

## Commit & Pull Request Guidelines

The history currently contains only an initial commit, so no formal convention is established. Use short, imperative subjects such as `Block LinkedIn feed cards` and keep commits scoped to one concern. Pull requests should explain the behavior change, list verification commands and browsers tested, and link related issues. Include screenshots or a short recording for popup or page-injection changes, and call out manifest permission or match-pattern changes explicitly.

## Security & Configuration

Request the narrowest manifest permissions and URL match patterns possible. Never commit credentials, signing keys, store tokens, or local browser profiles.
