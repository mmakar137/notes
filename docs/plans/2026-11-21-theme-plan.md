# Theme Client State Implementation Plan

> For the executing agent: use `godmode:inline-execution` to run this plan task by task.
> Steps use checkboxes for tracking. The user commits and signs; the agent does not commit.

**Goal:** Add a persisted Zustand theme store, apply the theme to `<html>`, expose a toggle in the header, and repaint all surfaces via CSS tokens without changing the light-mode appearance.

**Design:** `docs/plans/2026-11-21-theme-design.md`
**Architecture:** A third persisted Zustand store owns `isDark`. `App` syncs that boolean to the `dark` class on `<html>`; a pre-hydration script in `index.html` prevents a light flash. All colours come from CSS custom properties in `src/main.css`, so replacing hardcoded Tailwind colour utilities with `var(--color-*)` utilities makes the whole UI follow one switch.
**Stack:** React 19.2.8, TypeScript 6.0.2, Vite 8.3.1, Tailwind CSS 4.3.3 (`@tailwindcss/vite`), Zustand 5.1.0, external CDP harness (Node, no test files in repo).

## Global Constraints

- Respond in Russian; all UI strings remain English.
- Tailwind utility classes only. No CSS modules, no inline `style={{...}}` in components.
- No test code inside the repository. All browser checks live in `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`.
- Use narrow Zustand selectors in every consumer: `useThemeStore((s) => s.isDark)`, never destructure the whole store.
- Light-mode computed colours must stay byte-identical: form/card `rgb(255, 255, 255)`, body `rgb(248, 250, 252)`, accent `rgb(37, 99, 235)`.
- `docs/plans/` and `.godmode/` are ignored locally and must never be pushed.
- The agent leaves changes staged or uncommitted; the user commits, signs and pushes personally.

## Review Focus

1. A stale `theme` key left in localStorage by one harness task contaminating task 4's white-background assertions.
2. A persisted dark theme flashing light before React mounts.
3. A toggle that changes the class but not the visible surfaces because one hardcoded `bg-white` was missed.
4. The toggle being unreachable on `/login` while the theme still applies there.
5. Light-mode regressions from token replacement, especially exact computed colours asserted by harness task 4.

## Sources

- `tailwindcss@4.3.3`, `zustand@5.1.0` — read from local `node_modules/*/package.json` on 2026-11-21.
- `@custom-variant dark (&:where(.dark, .dark *));` and the pre-hydration `<html class="dark">` pattern — https://tailwindcss.com/docs/dark-mode (official Tailwind v4.3 docs, opened 2026-11-21).

## File Map

| File | Action | Responsibility |
|---|---|---|
| `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` | Modify | External tasks 26–30, theme seed helper, localStorage isolation |
| `src/store/themeState.ts` | Create | `isDark` + `toggleTheme`, persisted under `theme` |
| `src/main.css` | Modify | Colour tokens, `.dark` overrides, `@custom-variant dark` |
| `index.html` | Modify | Pre-hydration class sync |
| `src/App.tsx` | Modify | `useEffect` syncing `.dark`; token utilities |
| `src/pages/Layout.tsx` | Modify | Toggle button; narrow selectors; token utilities |
| `src/pages/{LoginPage,RegisterPage,EditNotePage,CreateNotePage,NoteViewPage,NotFoundPage,ErrorBoundary,notesPage}.tsx` | Modify (batch) | Token utilities |
| `src/components/{NoteCard,NoteFilterForm,CreateNoteForm}.tsx` | Modify (batch) | Token utilities |

All modifications are exact string substitutions of colour utility classes; no component logic changes except in `Layout`, `App` and the new store.

---

### Task 1: Failing browser tests for theme behaviour

**Files:** Modify `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` (`source` block near lines 105–110; append cases before the `for (const p of passes)` loop near the end).

**Covers:** every acceptance criterion; these are the regression net for Tasks 2–5.

- [ ] **Step 1: Add a `setTheme(isDark)` helper to the injected `source` next to `setFavorites`**

```js
function setTheme(isDark) { localStorage.setItem("theme", JSON.stringify({ state: { isDark }, version: 0 })); }
```

Also add, next to it, a conditional reset for non-theme tasks:

```js
${["26", "27", "28", "29", "30"].includes(task) ? "" : 'localStorage.removeItem("theme");'}
```

This runs on every new document before app code and keeps tasks 1–25 in light mode.

- [ ] **Step 2: Add task 26 — default is light**

Helper: `const themeButton = '[...document.querySelectorAll("header button")].find(b => /Dark mode|Light mode/.test(b.textContent))'`.

Seed `localStorage.removeItem("theme")`, navigate to `${base}/notes`, wait for 4 articles. Assert: `document.documentElement.classList.contains("dark")` === false; `themeButton()?.textContent.trim()` === `"Dark mode"`; `themeButton()?.getAttribute("aria-pressed")` === `"false"`; `localStorage.getItem("theme")` === null.

- [ ] **Step 3: Add task 27 — toggle on**

Seed `setTheme(false)`, navigate, wait for articles, click `themeButton()`. Wait for `document.documentElement.classList.contains("dark")` === true. Assert label `"Light mode"`, `aria-pressed` `"true"`, `JSON.parse(localStorage.theme).state.isDark` === true, `getComputedStyle(document.body).backgroundColor` === `"rgb(15, 23, 42)"`.

- [ ] **Step 4: Add task 28 — persistence across reload**

Seed `setTheme(true)`, navigate, wait for articles. Assert class present, label `"Light mode"`, body bg `"rgb(15, 23, 42)"`. Navigate again to the same URL and repeat the three assertions.

- [ ] **Step 5: Add task 29 — toggle back off**

Seed `setTheme(true)`, navigate, wait, click toggle, wait for class removal. Assert label `"Dark mode"`, `aria-pressed` `"false"`, `JSON.parse(localStorage.theme).state.isDark` === false, body bg `"rgb(248, 250, 252)"`.

- [ ] **Step 6: Add task 30 — surfaces follow the token**

Seed `setTheme(true)`, navigate, wait. Assert first `article` computed `backgroundColor` === `"rgb(30, 41, 59)"` and `color` === `"rgb(248, 250, 252)"`. Seed `setTheme(false)`, navigate again and assert article bg `"rgb(255, 255, 255)"`.

- [ ] **Step 7: Confirm all five fail**

Run (dev server at 5176 must be up):

```powershell
$env:TEST_URL = 'http://localhost:5176/notes'
26..30 | ForEach-Object { node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=$_ 2>&1 | Select-String 'task=' | Select-Object -Last 1 }
```

Expected: each task reports failures such as `timed out waiting for true` / `expected "Dark mode", got undefined` — proving the tests exercise missing behaviour, not a harness bug. Any harness ERROR line means fix the harness before proceeding.

---

### Task 2: Persisted theme store

**Files:** Create `src/store/themeState.ts`.

**Covers:** store shape and persistence.

**Interfaces:**
- Produces: `useThemeStore: UseBoundStore<StoreApi<ThemeState>>` where `ThemeState = { isDark: boolean; toggleTheme: () => void }`. Consumers in Tasks 3–4 import `useThemeStore`.

- [ ] **Step 1: Create the store**

Mirror `src/store/authState.ts` and `src/store/favoritesState.ts` exactly: `create<ThemeState>()(persist((set) => ({ isDark: false, toggleTheme: () => set((state) => ({ isDark: !state.isDark })) }), { name: "theme" }))`. Export the interface and the hook.

- [ ] **Step 2: Confirm no new failures**

Run: `npm run build`
Expected: exit 0. Re-run tasks 26–29: still failing on UI, but no build or runtime errors.

- [ ] **Step 3: Stage the file for the user's commit**

Run: `git add src/store/themeState.ts`
Expected: no output; user commits later.

---

### Task 3: Tokens and global class application

**Files:** Modify `src/main.css:1-18`, `index.html:2-8`, `src/App.tsx:1-11 and 91-97`.

**Covers:** theme reaches every route; no flash on reload.

**Interfaces:**
- Consumes: `useThemeStore((s) => s.isDark)` from Task 2.

- [ ] **Step 1: Add tokens to `src/main.css`**

After `@import "tailwindcss";` add `@custom-variant dark (&:where(.dark, .dark *));`. In the existing `@layer base`, keep the light `--color-bg: #f8fafc` and `--color-text: #0f172a`, and add `--color-text-muted: #64748b`, `--color-placeholder: #94a3b8`, `--color-surface: #ffffff`, `--color-surface-muted: #f8fafc`, `--color-border: #e2e8f0`, `--color-accent-soft: #eff6ff`, `--color-error-bg: #fef2f2`, `--color-error-text: #ef4444`. Add a `.dark` block in the same layer overriding them with the dark column of the design table.

- [ ] **Step 2: Add the pre-hydration script to `index.html`**

Inside `<head>`, before the stylesheet/module loads:

```html
<script>
  try {
    const saved = JSON.parse(localStorage.getItem("theme") || "{}")
    if (saved?.state?.isDark) document.documentElement.classList.add("dark")
  } catch {}
</script>
```

- [ ] **Step 3: Sync the class in `App`**

In `src/App.tsx`, import `useEffect` from `react` and `useThemeStore` from `./store/themeState`. Inside `App()`, before the return: `const isDark = useThemeStore((s) => s.isDark)` and `useEffect(() => { document.documentElement.classList.toggle("dark", isDark) }, [isDark])`.

- [ ] **Step 4: Confirm partial progress**

Run: `npm run lint` then tasks 26 and 28.
Expected: lint exit 0; task 26 passes (no toggle yet → its button assertions still fail); task 28 passes its class/bg assertions but fails the label assertion. Body-background assertions in tasks 27/29 should now be correct.

- [ ] **Step 5: Stage for the user's commit**

Run: `git add src/main.css index.html src/App.tsx`

---

### Task 4: Header toggle

**Files:** Modify `src/pages/Layout.tsx:1-34`.

**Covers:** visible control, accessible state, persisted toggle.

**Interfaces:**
- Consumes: `useThemeStore((s) => s.isDark)` and `useThemeStore((s) => s.toggleTheme)` from Task 2.

- [ ] **Step 1: Add the button**

Change line 5's whole-store destructure to two narrow selectors for auth (`user`, `logout`) plus the two theme selectors. Insert before the `Logout` button (currently lines 28–33):

```tsx
<button
  type="button"
  aria-pressed={isDark}
  className="cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-text)] transition-colors duration-150 hover:bg-[var(--color-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
  onClick={() => toggleTheme()}
>
  {isDark ? "Light mode" : "Dark mode"}
</button>
```

Keep the existing `if (!user) return <Navigate to="/login" />` unchanged.

- [ ] **Step 2: Run theme tasks 26–29**

Run with `TEST_URL` set as in Task 1: `--task=26`, `27`, `28`, `29`.
Expected: all four pass. Task 30 still fails on `article` background because tokens are not applied to cards yet.

- [ ] **Step 3: Stage for the user's commit**

Run: `git add src/pages/Layout.tsx`

---

### Task 5: Token substitution batch

**Files:** Modify 13 files listed in the File Map. This is a batch of identical substitutions; group them in one pass.

**Covers:** dark theme on all surfaces; no light-mode regression.

- [ ] **Step 1: Apply the substitution table across every `.tsx` under `src/`**

| Current utility | Replacement |
|---|---|
| `bg-white` | `bg-[var(--color-surface)]` |
| `text-[#0f172a]`, `text-slate-900` | `text-[var(--color-text)]` |
| `text-[#64748b]` | `text-[var(--color-text-muted)]` |
| `placeholder:text-[#94a3b8]` | `placeholder:text-[var(--color-placeholder)]` |
| `border-[#e2e8f0]`, `border-slate-200` | `border-[var(--color-border)]` |
| `hover:bg-[#f8fafc]` | `hover:bg-[var(--color-surface-muted)]` |
| `hover:bg-blue-50` | `hover:bg-[var(--color-accent-soft)]` |
| `bg-[#fef2f2]` | `bg-[var(--color-error-bg)]` |
| `text-[#ef4444]` | `text-[var(--color-error-text)]` |

Leave `bg-[#2563eb]`, `hover:bg-[#1d4ed8]`, `text-[#2563eb]`, `hover:text-[#1d4ed8]`, `bg-red-600/700`, error border `border-red-500/20`, focus outlines and all layout/length utilities untouched. In `src/pages/Layout.tsx:13` replace `bg-gray-100` with `bg-gray-100 dark:bg-slate-900`.

- [ ] **Step 2: Run task 30**

Run: `node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=30` with `TEST_URL` set.
Expected: 6 passed, 0 failed (or more if extra assertions were added).

- [ ] **Step 3: Full regression**

Run: tasks `1..25` (`4` with `--empty`) and `26..30`.
Expected: 215 passed / 0 failed for 1–25, plus all theme tasks passing. No task may report a computed-colour mismatch.

- [ ] **Step 4: Quality gates**

Run: `npm run lint` and `npm run build`.
Expected: both exit 0; build reports ~114 modules transformed.

- [ ] **Step 5: Stage for the user's commit**

Run: `git add src`
Expected: staged code changes only; `git status` must not list `docs/plans/` or `.godmode/`.

---

### Task 6: Review and handoff

**Files:** none in the repository.

- [ ] **Step 1: Code review against the approved design**

Check: store shape and key; narrow selectors; class applied on `/login` and `/`; toggle label and `aria-pressed`; every token defined in both themes; no inline styles; no test files in the repo; no docs/agent files staged.

- [ ] **Step 2: Completion gate**

Re-run the exact commands from Task 5 Steps 3–4 immediately before declaring done. Record the numbers.

- [ ] **Step 3: Hand off**

Report to the user in Russian: what changed, the fresh test/lint/build numbers, which files are staged, and that they must commit, sign and push. Do not push.

---

## Self-review

- Every path is exact; `Layout.tsx:13` and `:28-33`, `App.tsx:91-97`, `main.css:1-18`, `index.html:2-8` are anchored to the files read on 2026-11-21.
- Names are consistent: `useThemeStore`, `isDark`, `toggleTheme`, key `theme` are produced in Task 2 and consumed in Tasks 3–4.
- Every design decision maps to a task: store → 2, class/application → 3, toggle → 4, tokens → 3 and 5, verification → 1, 5, 6.
- All five Review Focus inputs are pinned: 1 → Task 1 Step 1, 2 → Task 3 Step 2, 3 → Task 5 Step 1, 4 → Task 3 Step 3, 5 → Task 5 Step 3.
- Execution mode: **inline** — six small sequential tasks, one context, one final review.
