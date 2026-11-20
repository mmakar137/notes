# Error Boundary Implementation Plan

> For the executing agent: use godmode:inline-execution to run this plan task by task.
> Steps use checkboxes for tracking.

**Goal:** добавить полноэкранную страницу ошибки, которая перехватывает непредвиденные исключения рендера и возвращает пользователя на главную.
**Design:** docs/plans/2026-11-20-error-boundary-design.md
**Architecture:** `ErrorBoundary.tsx` — class-компонент с `getDerivedStateFromError`/`componentDidCatch`, оборачивает `RouterProvider` в `App.tsx` внутри `AuthProvider`. При отсутствии ошибки рендерит `children`, при сбое — карточку с сообщением, деталями и кнопкой `window.location.href = "/"`. Тест task 12 во внешнем CDP-харнесе вызывает настоящий `RangeError` через невалидный `createdAt`.

**Stack:** React 19.2.8, react-router 8.5.0, Tailwind 4.3.3, TypeScript 6.0.2, scratch-CDP-харнесс `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`.

## Global Constraints
-_tailwind только; без CSS-модулей, inline-стилей и новых зависимостей; `package.json` не меняется._
- Не менять `src/components/CreateNoteForm.tsx`, `src/components/NoteFilterForm.tsx`, `onTagsChange(tags: string[])`, `selectedTags.every(...)` и дублирующий маршрут `/notes` в `App.tsx`.
- Не коммитить `db.json`; push не делать без отдельной просьбы.
- Тесты: каждый `--task` запускается отдельным процессом; task 4 требует `--empty`.
- Харнесс находится вне репозитория: его изменения не коммитятся, но красный/зелёный вывод фиксируется в журнале.

## Review Focus
- Заметка с невалидным `createdAt`: ожидается `RangeError` в рендере и fallback вместо пустого экрана — task 2, тест task 12.
- Выброшенное значение arbitrarily (строка/null): детали показываются через `String(error)`, страница не падает второй раз — task 2, статическая проверка `render()` (отдельный runtime-тест требует test-only кода в приложении, что запрещено дизайном).
- `console.error`: ожидается вызов с сообщением `Uncaught error:` и `componentStack` — task 2, тест task 12.
- Кнопка `Back to home`: ожидается переход на `/` и заголовок `Home Page` — task 2, тест task 12.
- Обычные страницы и auth-guard: ожидается отсутствие регресса — task 2, tasks 1–11.

## Sources
- `docs/plans/2026-11-20-error-boundary-design.md` — утверждённый дизайн, 2026-11-20.
- `package.json:16,19` — версии React и react-router, прочитано 2026-11-20.
- `src/main.tsx:6-9` — StrictMode, прочитано 2026-11-20.
- `src/App.tsx:72-78` — текущая точка входа, прочитано 2026-11-20.
- `src/pages/CreateNotePage.tsx:32-42`, `src/pages/EditNotePage.tsx:143-147` — стиль карточек, прочитано 2026-11-20.
- https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary — API Error Boundary, открыто 2026-11-20.

## File Map
| File | Action | Responsibility |
|---|---|---|
| `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` | Modify (вне репозитория) | fixture task 12, перехват `console.error`, тест fallback |
| `src/pages/ErrorBoundary.tsx` | Create | class boundary + вёрстка fallback |
| `src/App.tsx` | Modify | импорт и обёртка вокруг `RouterProvider` |

### Task 1: тест падения рендера

**Files:**
- Modify: `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` (fixture ~101, `source` ~107, initial wait ~192, блок task 11 ~633)

**Covers:** criteria 1–4 из раздела Acceptance criteria дизайна.

**Interfaces:**
- Produces: GET `/notes/crash-note-1` с невалидной датой; ожидается `#error-fallback`.
- Consumes Task 2: реализацию `ErrorBoundary`, которая заменяет упавший `children` на fallback.

- [ ] **Step 1: добавить фикстуру и перехват console.error**

В массив `fixture` после строки с `view-note-1` добавить только для task 12:
```js
...(task === "12" ? [{ id: "crash-note-1", title: "Crash note", content: "body", createdAt: "not-a-date", hidden: false, tags: [] }] : []),
```
В шаблон `source` после `window.__fetchLog = [];` добавить:
```js
window.__consoleErrors = [];
const originalConsoleError = console.error.bind(console);
console.error = (...args) => {
  window.__consoleErrors.push(args.map(a => a instanceof Error ? a.message : String(a)));
  originalConsoleError(...args);
};
```
В initial wait (ветка `task === "11"`) добавить `|| task === "12"`.

- [ ] **Step 2: добавить тест task 12**

После блока `task === "11"` добавить:
```js
if (task === "12" || task === "all") {
  await caseRun("task12 error boundary", async () => {
    const base = (process.env.TEST_URL || "http://localhost:5176/notes").replace(/\/(notes|create|login)$/, "")
    await send("Page.navigate", { url: `${base}/notes/crash-note-1` })
    await waitFor("!!document.querySelector('#error-fallback')", true, "error fallback shown")
    eq("error heading", await evaluate(`document.querySelector('h1')?.textContent.trim()`), "Something went wrong.")
    eq("error explanation", await evaluate(`document.querySelector('#error-fallback')?.textContent.includes("An unexpected error occurred. You can return to the home page and try again.")`), true)
    eq("error details", await evaluate(`document.querySelector('#error-fallback')?.textContent.includes("Invalid time value")`), true)
    eq("console error logged", await evaluate(`window.__consoleErrors.some(e => e === "Uncaught error:" || e.includes("Invalid time value"))`), true)
    ok("back to home button", await evaluate(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === "Back to home")`))
    ok("back to home clicked", await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(b => b.textContent.trim() === "Back to home"); if(!b) return false; b.click(); return true; })()`))
    await waitFor("location.pathname", "/", "back to home")
    eq("home path", await evaluate(`location.pathname`), "/")
    eq("home heading", await evaluate(`document.querySelector('h1')?.textContent.trim()`), "Home Page")
  })
}
```

- [ ] **Step 3: красный прогон**

Run: `$env:TEST_URL='http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=12`
Expected: `FAIL error fallback shown: timed out waiting for true`, `FAIL error heading: expected "Something went wrong.", got undefined`, `FAIL console error logged: expected true, got false`, `task=12: 1 passed, 8 failed` (проходит только проверка отсутствия fallback до клика).

- [ ] **Step 4: зафиксировать красный в журнале; коммит не требуется**

Записать в `.godmode/runs/2026-11-20-error-boundary-plan/progress.md` команду и вывод. Харнесс вне репозитория — `git commit` на этом шаге не выполняется.

### Task 2: страница ErrorBoundary

**Files:**
- Create: `src/pages/ErrorBoundary.tsx`
- Modify: `src/App.tsx` (импорт и обёртка вокруг `RouterProvider`)

**Covers:** criteria 1–6 из раздела Acceptance criteria дизайна.

**Interfaces:**
- Consumes: `Component`, `ErrorInfo`, `ReactNode` из `react`; `children` от `App.tsx`.
- Produces: `ErrorBoundary` (default export class) с `state: { error: unknown }`; fallback имеет `id="error-fallback"`.

- [ ] **Step 1: реализовать `src/pages/ErrorBoundary.tsx`**

Сигнатура и имена фиксированы:
```tsx
type Props = { children: ReactNode }
type State = { error: unknown }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: unknown): State
  componentDidCatch(error: unknown, info: ErrorInfo): void
  render(): ReactNode
}
```
`getDerivedStateFromError` возвращает `{ error }`; `componentDidCatch` вызывает `console.error("Uncaught error:", error, info.componentStack)`. `render` возвращает `this.props.children`, если `error === null`, иначе fallback:
- контейнер `mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14`;
- `h1` с «Something went wrong.»;
- `<div id="error-fallback">` с пояснением «An unexpected error occurred. You can return to the home page and try again.», деталями `this.state.error instanceof Error ? this.state.error.message : String(this.state.error)` и кнопкой `Back to home`;
- кнопка `type="button"` с `onClick={() => { window.location.href = "/" }}`;
- Tailwind-классы по образцу `CreateNotePage.tsx:33-41` и `EditNotePage.tsx:143-147`; без inline-стилей.

- [ ] **Step 2: подключить в `src/App.tsx`**

Добавить `import ErrorBoundary from "./pages/ErrorBoundary"` и обернуть существующий `RouterProvider`:
```tsx
<AuthProvider>
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
</AuthProvider>
```
Не менять маршруты, включая дублирующий `/notes`.

- [ ] **Step 3: зелёный прогон и регресс**

Run: task 12; затем tasks 1–11 по одному (task 4 с `--empty`); `npm run build`; `npm run lint`.
Expected: task 12 без падений, tasks 1–11 зелёные, build/lint exit 0.

- [ ] **Step 4: коммит**

`git add src/pages/ErrorBoundary.tsx src/App.tsx && git commit -m "feat: add error boundary fallback page"`.

## Handoff
Plan saved. Рекомендую inline execution: 2 задачи, последовательные и короткие. Delegated execution — альтернатива, если нужен свежий reviewer между задачами.
