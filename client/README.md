# HandIt Client

Frontend app for HandIt, built with React 19, Vite 8, TypeScript 6, Tailwind CSS 4, and shadcn/ui primitives.

## Requirements

- Node.js >= 20.19.0
- npm

## Scripts

- `npm run dev` - start local development server
- `npm run build` - type-check and build production bundle
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build locally

## UI Baseline

- Tailwind v4 theme tokens live in `src/index.css` (`@theme` block).
- shadcn components are under `src/components/ui`.
- Shared class utility is in `src/lib/utils.ts`.
- Use the `@` alias for imports from `src`.

## Conventions

- Keep UI primitives minimal and token-driven.
- Prefer semantic color utilities (for example: `bg-primary`, `text-text-secondary`, `border-border`).
- Avoid adding generated boilerplate variants unless there is a clear product requirement.
