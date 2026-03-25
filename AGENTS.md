# Repository Guidelines

reply me in Chinese

## Project Structure & Module Organization
- Main code lives in `src/`.
- App Router routes and API handlers: `src/app/` (for example `src/app/api/widgets/route.ts`).
- UI and feature components: `src/components/` (`layout/`, `widgets/`, `settings/`, `ui/`).
- Shared logic/utilities: `src/lib/`; state stores (Zustand): `src/store/`; shared types: `src/types/`.
- Tests are colocated under `src/__tests__/` and use `*.test.ts` naming.
- Static assets are in `public/`; localization messages are in `messages/`.

## Build, Test, and Development Commands
- `npm run dev`: start local Next.js dev server at `http://localhost:3000`.
- `npm run build`: production build (also catches type issues in CI flow).
- `npm run start`: run the built app.
- `npm run lint`: run ESLint with `next/core-web-vitals` rules.
- `npm test`: run Jest tests (`jest-environment-jsdom`).
- Docker option: `docker-compose up -d` for containerized local run.

## Coding Style & Naming Conventions
- Language: TypeScript (`strict: true` in `tsconfig.json`).
- Formatting (Prettier): 2-space indent, single quotes, semicolons, trailing commas (`es5`), `printWidth: 100`.
- Components and files for React views use PascalCase (for example `WidgetPicker.tsx`); hooks/stores use camelCase with `use` prefix (for example `useWidgetStore.ts`).
- Prefer path alias imports via `@/*` for `src/*`.

## Testing Guidelines
- Framework: Jest + Testing Library (`jest.setup.js` loads `@testing-library/jest-dom`).
- Put unit tests in `src/__tests__/` with `*.test.ts` suffix.
- Add/adjust tests when changing schemas, store behavior, or widget rendering logic.
- Run `npm test` locally before opening a PR.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style used in history: `feat:`, `fix:`, `docs:`, `chore:`.
- Keep commits scoped and descriptive (example: `feat: add links widget import validation`).
- PRs should include:
  - concise summary of behavior changes,
  - linked issue (if applicable),
  - screenshots or short GIFs for UI changes,
  - confirmation that `npm run lint`, `npm run build`, and `npm test` pass.

## Security & Configuration Tips
- Do not commit secrets. Start from `.env.example` for local config.
- Runtime data is stored via server-side JSON/filesystem paths; verify write permissions when using Docker volumes.
