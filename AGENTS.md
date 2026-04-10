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

## Changelog Recording Rules
- When adding a new feature, fixing a user-visible bug, completing an important optimization, or making a behavior/data-structure-affecting refactor, also record the change in the root `changelog.md`.
- Record meaningful changes only. Do not add entries for trivial copy tweaks or minor style-only adjustments unless the user explicitly asks for them.
- Keep entries concise and searchable. Focus on what changed, what areas were affected, and what remains to be done.
- If `changelog.md` already exists, continue its existing style while preserving the requirements below.
- If `changelog.md` does not exist, create it in Markdown format at the repository root.
- Group entries by date using `## YYYY-MM-DD`.
- Use one entry per meaningful change with a heading like `### feat: feature name`.
- Preferred change types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Use this template for every entry:

```md
## YYYY-MM-DD

### feat|fix|refactor|docs|test|chore: title
- 做了什么：
- 影响范围：
- 涉及模块：
- 是否有兼容性影响：
- 后续待补充：
```

- After completing implementation work, the assistant should by default also provide or update the corresponding `changelog.md` entry unless the user explicitly says not to record it.
- When the change is substantial, briefly align the changelog entry with the current development track, such as mobile adaptation, widgets, templates, or extensibility.

## Security & Configuration Tips
- Do not commit secrets. Start from `.env.example` for local config.
- Runtime data is stored via server-side JSON/filesystem paths; verify write permissions when using Docker volumes.
