# Not found page implementation plan

> For the executing agent: use `godmode:inline-execution` to run this plan task by task. Steps use checkboxes for tracking.

**Goal:** любой несовпавший URL показывает отдельную страницу 404 с выходом на главную, без auth-guard и без ошибки рендера.
**Design:** `docs/plans/2026-11-20-not-found-page-design.md`
**Architecture:** stateless function component `NotFoundPage` рядом с другими страницами в `src/pages/`. Маршрут `*` — последний top-level сиблинг в `createBrowserRouter`, после pathless-родителя с `ErrorBoundary` и вне `Layout`; внешняя обёртка `ErrorBoundary` вокруг `RouterProvider` остаётся. Тест живёт во внешнем CDP-харнесе, продакшн не содержит test-only кода.

**Stack:** TypeScript 5.x, React 19.2.8, react-router 8.5.0, Tailwind 4.3.3, Vite 8.3.1 (versions from `package.json:16,19`, read 2026-11-20; Vite version from installed build output 2026-11-20).

## Global Constraints

- Tailwind только; без CSS-модулей, inline-стилей и новых зависимостей (`package.json` не меняется).
- Не менять `src/components/CreateNoteForm.tsx`, `src/components/NoteFilterForm.tsx`, `onTagsChange(tags: string[])`, `selectedTags.every(...)` и дублирующий маршрут `/notes` в `src/App.tsx`.
- Не коммитить `db.json`; push только по отдельной просьбе.
- UI-тексты английские: `Page not found.`, `The page you are looking for does not exist.`, `Back to home`.
- Харнес `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` вне репозитория; тест добавляется только туда.
- Dev-серверы уже запущены: Vite `http://localhost:5176`, json-server `http://localhost:3000`; проверено 2026-11-20 (оба URL → HTTP 200).

## Review Focus

1. Неавторизованный гость на неизвестном пути → 404, а не редирект на `/login` (Layout не используется).
2. Вложенный неизвестный путь (`/notes/unknown/extra`) → тот же catch-all, а не пустой `Outlet`.
3. Неизвестный путь не должен выглядеть как сбой рендера: ни `#error-fallback`, ни `Unexpected Application Error!`.
4. Ссылка `Back to home` должна реально переводить на `/` и показывать `Home Page` клиентской навигацией.
5. Существующие маршруты, особенно дублирующий `/notes` и auth-guard `Layout`, не должны измениться — `*` не должен их затенять.

## Sources

- `docs/plans/2026-11-20-not-found-page-design.md` — утверждённый дизайн, прочитано 2026-11-20.
- `node_modules/react-router/dist/development/lib/router/utils.d.ts:741-748` — `path` может заканчиваться на `/*`; `path: "*"` как catch-all, прочитано 2026-11-20.
- `node_modules/react-router/dist/development/lib/router/router.js:1318-1327` — внутренний 404 при отсутствии совпадения, прочитано 2026-11-20.
- `node_modules/react-router/dist/development/lib/hooks.js:723-773` — de facto default error element при 404, прочитано 2026-11-20.
- `src/pages/ErrorBoundary.tsx:29-35` — контейнер и карточка для новой страницы, прочитано 2026-11-20.
- `src/App.tsx:12-85` — текущий массив маршрутов и точка вставки, прочитано 2026-11-20.
- `package.json:16,19` — версии React и react-router, прочитано 2026-11-20.

## File Map

| File | Action | Responsibility |
|---|---|---|
| `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` | Modify (outside repo) | task 13: 404-контент, клик, отсутствие error-страницы |
| `src/pages/NotFoundPage.tsx` | Create | статичная страница 404 |
| `src/App.tsx` | Modify: import after line 10; route after line 82, before line 83 | подключить catch-all последним top-level сиблингом |

## Task 1: красный тест task 13

**Files:**
- Modify: `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` (вне репозитория; коммит не требуется)

**Covers:** acceptance criteria дизайна — заголовок, пояснение, ссылка, клик, отсутствие error fallback.

**Interfaces:**
- Produces: `--task=13` харнеса; ожидает `#not-found` и заголовок `Page not found.` в DOM.

- [ ] **Step 1: добавить task 13 в харнес**

После блока `if (task === "12" || task === "all")` добавить `if (task === "13" || task === "all")` с `caseRun("task13 not found page", ...)`:
  - `Page.navigate` на `${base}/definitely-missing-route`, где `base` вычисляется как в task 12;
  - `waitFor("document.querySelector('h1')?.textContent.trim()", "Page not found.", "404 heading")`;
  - `eq` для заголовка, пояснения `The page you are looking for does not exist.`, `href="/"` у `#not-found a`, текста `Back to home`, `location.pathname === "/definitely-missing-route"`;
  - `ok` для отсутствия `#error-fallback` и отсутствия строки `Unexpected Application Error!` в `document.body.textContent`;
  - реальный `a.click()`, `waitFor("location.pathname", "/", "404 back home")`, затем проверка `Home Page`;
  - второй `caseRun("task13 nested path", ...)` для `${base}/notes/unknown/extra`: тот же заголовок `Page not found.`.

- [ ] **Step 2: запустить и увидеть красный**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=13`
Expected: exit 1; `FAIL 404 heading: timed out waiting for "Page not found."`; остальные assertions красные. Сохранить вывод в `.godmode/runs/2026-11-20-not-found-page-plan/task-13-red.log`.

## Task 2: страница и маршрут

**Files:**
- Create: `src/pages/NotFoundPage.tsx`
- Modify: `src/App.tsx` (import после строки 10; маршрут после строки 82)

**Covers:** все acceptance criteria; Review Focus 1–5.

**Interfaces:**
- Consumes: nothing.
- Produces: default export `NotFoundPage(): JSX.Element`; маршрут `{ path: "*", element: <NotFoundPage /> }`.

- [ ] **Step 1: создать `src/pages/NotFoundPage.tsx`**

Default export function component без состояния и запросов. Root-контейнер и карточка как в `src/pages/ErrorBoundary.tsx:29-35`. Внутри карточки `<div id="not-found">` с `<p>` пояснения и `<Link to="/">Back to home</Link>`; стиль ссылки — синяя кнопка из `src/App.tsx:39`. Только Tailwind.

- [ ] **Step 2: добавить маршрут в `src/App.tsx`**

Добавить `import NotFoundPage from "./pages/NotFoundPage"` после импорта `Layout`. Вставить `{ path: "*", element: <NotFoundPage /> },` сразу после объекта дублирующего `/notes` (строки 79–82), до закрывающей `],` строки 83. Не трогать сам объект `/notes`, pathless-родителя и внешнюю обёртку `ErrorBoundary`.

- [ ] **Step 3: зелёный прогон**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=13`
Expected: exit 0, `task=13: <n> passed, 0 failed`. Сохранить в `task-13-green.log`.

- [ ] **Step 4: регресс и качество**

Run: tasks 1–12, 14, 15 по одному (task 4 с `--empty`), затем `npm run build` и `npm run lint`.
Expected: все exit 0; логи `task-N-final.log`, `build-final.log`, `lint-final.log` в `.godmode/runs/2026-11-20-not-found-page-plan/`.

- [ ] **Step 5: коммит**

```bash
git add src/pages/NotFoundPage.tsx src/App.tsx
git commit -m "feat: add not found page for unknown routes"
```

## Handoff

Plan saved. Рекомендую inline execution: 2 задачи, последовательные и короткие, контекст удерживается. Delegated execution — альтернатива, если нужен свежий ревьюер между задачами. Workspace isolation не нужна: пользователь ранее выбрал работу в текущем checkout `hw3`, dev-серверы и харнес привязаны к нему.
