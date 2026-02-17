# 🤖 StatWizard AI Rulebook

> **This document governs how any AI assistant must behave when editing this codebase.**
> Violations of these rules will produce bugs, missing imports, broken builds, and unmaintainable code.

---

## 1. Architecture Rules

### 1.1 File Organization — Know Where Things Go

| Directory | Purpose | Example Files |
|---|---|---|
| `src/components/common/` | Shared, reusable UI primitives | `TabButton`, `MathTerm`, `InfoCard` |
| `src/components/visuals/` | Statistical visualizer components (one per test) | `AnovaVisual`, `NormalDistributionVisual` |
| `src/components/formula/` | Equation display / assumption checking | `FormulaDisplay`, `AssumptionItem` |
| `src/components/navigation/` | Page-level navigation views | `MainMenu`, `ModulesView`, `SearchView` |
| `src/components/tutor/` | AI tutor panel and related UI | `TutorPanel` |
| `src/hooks/` | Custom React hooks | `useTutor` |
| `src/data/` | Pure data / constants (no JSX) | `wizardSteps`, `mathTerms`, `tutorScripts` |
| `src/utils/` | Pure utility functions (no React) | `mathHelpers`, `svgHelpers` |
| `src/App.jsx` | **Orchestration only** — imports and routes | — |

**Rules:**
- **Never put component logic in `App.jsx`.** It is a thin routing/state shell.
- **Never put JSX in `data/` or `utils/` files.** They must be pure JavaScript.
- **One component per file.** The filename must match the default export name.
- **New visualizers go in `src/components/visuals/`** and must be registered in `wizardSteps.js`.

### 1.2 Component Size Limits

- **Hard cap: 500 lines per component file.** If a component exceeds this, extract sub-components.
- Sub-components of a visualizer (e.g., `FSamplingDist`, `GroupsMeansView`, `VarianceDecomposition`) live in the **same directory** as their parent.
- If a sub-component is reused across multiple visualizers, promote it to `components/common/`.

### 1.3 No Monolith Regression

- **Never merge multiple components back into a single file.**
- **Never create "god components"** that handle unrelated UI concerns.
- Each component should have a **single, clear responsibility**.

---

## 2. Import Rules (CRITICAL)

> **The #1 source of production crashes in this project has been missing imports.**

### 2.1 Before Submitting Any Change, Verify Imports

For **every** JSX component or icon referenced in the file's return/render block:

1. ✅ Check that an `import` statement exists at the top of the file.
2. ✅ Check that the import path is correct and the file actually exists.
3. ✅ Check that named imports (e.g., `{ CheckCircle }` from `lucide-react`) match the exact export name.

### 2.2 Common Import Sources

| What You Need | Where to Import From |
|---|---|
| Icons (e.g., `CheckCircle`, `Play`) | `lucide-react` |
| Math functions (`normalCDF`, `tCDF`, etc.) | `../../utils/mathHelpers` |
| SVG helpers (`pointsToPath`, etc.) | `../../utils/svgHelpers` |
| Step data (`STAT_PAGE_LIST`, `FAMILIES`) | `../../data/wizardSteps` |
| Math term definitions | `../../data/mathTerms` |
| Shared components (`TabButton`, `MathTerm`) | `../common/ComponentName` |
| Tutor hook | `../../hooks/useTutor` |

### 2.3 Import Checklist (Run Mentally Before Every Commit)

```
For each file I touched:
  □ Every <ComponentName /> in JSX has a matching import
  □ Every icon (PascalCase from lucide-react) used in JSX is in the import list
  □ Every utility function called has a matching import
  □ No unused imports are left behind
  □ Import paths use correct relative depth (../../ vs ../)
```

---

## 3. Coding Standards

### 3.1 React Patterns

- Use **functional components** with hooks. No class components.
- Use `useState`, `useEffect`, `useMemo`, `useRef` from React — never roll custom state management.
- Pass data down via **props**. Lift state to the nearest common ancestor.
- Wrap visualizers in `<ErrorBoundary>` to prevent full-app crashes.

### 3.2 Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Component files | PascalCase `.jsx` | `AnovaVisual.jsx` |
| Data/util files | camelCase `.js` | `mathHelpers.js` |
| React components | PascalCase | `const AnovaVisual = () => {}` |
| Hooks | `use` prefix, camelCase | `useTutor` |
| Constants | UPPER_SNAKE_CASE | `STAT_PAGE_LIST` |
| Functions | camelCase | `calculateAnova()` |
| CSS classes | kebab-case or Tailwind | `stat-card`, `bg-slate-800` |

### 3.3 Styling

- This project uses **Tailwind CSS**. Prefer Tailwind utility classes over custom CSS.
- Custom CSS goes in `src/index.css` only — never in component files.
- Use the existing dark mode pattern: accept `darkMode` prop, apply conditional classes.

### 3.4 Error Handling

- All visualizer components are wrapped in `ErrorBoundary`. **Do not remove these wrappers.**
- If adding a new visualizer, register it inside the existing `ErrorBoundary` pattern in `App.jsx`.
- Validate numeric inputs before passing to math functions (avoid `NaN`, `Infinity`).

---

## 4. Data Integrity Rules

### 4.1 `wizardSteps.js`

- Each entry in `STAT_PAGE_LIST` must have: `key`, `title`, `category`, `family`, `icon`, `desc`.
- The `key` must be unique across all entries.
- The `category` must be one of: `'Descriptive'`, `'Mean Comparisons'`, `'Linear Modeling'`, `'Non-parametric'`.

### 4.2 `tutorScripts.js`

- Tutor scripts are keyed by the statistical test `key` from `wizardSteps.js`.
- Each script must have steps with `title` and `content` arrays.
- Never delete tutor scripts without also removing the corresponding test from `wizardSteps.js`.

### 4.3 `mathHelpers.js`

- All math functions must be **pure** (no side effects, no DOM access).
- All functions must handle edge cases: `n=0`, `n=1`, negative values, division by zero.
- Export every function that is used outside this file.

---

## 5. Build & Deploy Rules

### 5.1 Always Build Before Committing

```bash
npx vite build
```

- The build **must complete with 0 errors** before committing.
- Warnings about chunk size are acceptable but should be noted.
- **Never commit code that fails to build.**

### 5.2 Git Workflow

- All changes go to the `main` branch (triggers auto-deploy via GitHub Actions).
- Write clear, descriptive commit messages.
- Commit related changes together (e.g., a new component + its import in `App.jsx`).
- **Never commit `node_modules/`, `dist/`, or `.vite/`.**

### 5.3 Deployment

- Deployment is automatic via `.github/workflows/deploy.yml`.
- After pushing, verify the GitHub Actions run succeeds.
- Live site: `https://jsr1151.github.io/statwizard/`

---

## 6. Change Impact Checklist

Before submitting any change, mentally verify:

```
□ Build passes (npx vite build)
□ All imports are present and correct
□ No component references undefined variables
□ Dark mode styling is applied consistently
□ New components are exported as default
□ New data entries follow existing schema
□ No files exceed 500 lines
□ Commit message accurately describes the change
```

---

## 7. Forbidden Actions

| ❌ Never Do This | ✅ Do This Instead |
|---|---|
| Merge components into a single large file | Keep components modular and focused |
| Use inline `<script>` or `<style>` tags | Use React components and Tailwind |
| Hardcode colors/sizes outside Tailwind | Use Tailwind classes or CSS variables |
| Skip the build step before committing | Always run `npx vite build` first |
| Delete error boundaries | Keep all existing safety wrappers |
| Add dependencies without mentioning it | Explicitly state any `npm install` needed |
| Guess at import paths | Verify the file exists at the expected path |
| Leave `console.log` statements in production | Remove all debug logging before commit |

---

*Last updated: February 16, 2026*
