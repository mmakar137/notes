# Note ownership implementation plan

> For the executing agent: use `godmode:inline-execution` to run this plan task by task. Steps use checkboxes for tracking.

**Goal:** вошедший пользователь работает только со своими заметками: список, создание, просмотр, редактирование и удаление.
**Design:** `docs/plans/2026-11-20-note-ownership-design.md` (утверждён пользователем 2026-11-20, amended после builder check).
**Architecture:** владелец хранится в `authorId` заметки; `useAuthContext()` даёт текущего пользователя. Список фильтруется в браузере (серверный `?authorId` не работает с числовым id в этой версии json-server), каждая операция проверяет владельца перед запросом. Тесты только во внешнем CDP-харнесе, production не содержит test-only кода.
**Stack:** TypeScript 6.0.3, React 19.3.0, react-router 8.5.0, react-hook-form 7.89.0, Tailwind 4.3.3, Vite 8.3.1, json-server 1.0.0-beta.15 — точные версии из `package-lock.json`, прочитано node-командой 2026-11-20.

## Global Constraints

- Tailwind только; без CSS-модулей, inline-стилей и новых зависимостей (`package.json` не меняется).
- Не менять `src/components/CreateNoteForm.tsx`, `src/components/NoteFilterForm.tsx`, `onTagsChange(tags: string[])`, `selectedTags.every(...)` и дублирующий маршрут `/notes` в `src/App.tsx`.
- Не коммитить `db.json`; push только по отдельной просьбе.
- UI-тексты английские; единый текст доступа `You can only work with your own notes.`.
- Тесты остаются во внешнем харнесе `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`; тестового кода в production нет.
- Dev-серверы уже запущены: Vite `http://localhost:5176`, json-server `http://localhost:3000`; проверено 2026-11-20. Команда теста: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=<N>`; задача 4 требует `--empty`.
- Контроль только на клиенте: прямой API-запрос обходит проверку — ограничение уже зафиксировано в дизайне.

## Review Focus

1. Гость на дублирующем `/notes` (вне `Layout`) → без запроса к `/notes` и редирект на `/login`, не пустой список (проверяют Task 4 и регресс task 5/8 в Task 6).
2. Заметка без `authorId` (устаревшие записи) → считается чужой, не показывается в списке и блокируется в view/edit (Task 4, Task 5; code-review в Task 6).
3. Два пользователя с одинаковым email/паролем → логин выбирает первого и кладёт один объект, а не массив (Task 2, task 9).
4. `hidden: true` у своей заметки → она остаётся видимой в отфильтрованном списке; hidden не путается с владельцем (Task 4, task 1/2 регресс в Task 6).
5. Прямой URL чужой заметки после перезагрузки → текст доступа, никаких данных, `PATCH`/`DELETE` в логе нет (Task 5, task 18/19).

## Sources

- `docs/plans/2026-11-20-note-ownership-design.md` — утверждённый дизайн, прочитано 2026-11-20.
- `.godmode/runs/2026-11-20-note-ownership-plan/builder-check.md` — снятые блокирующие вопросы, прочитано 2026-11-20.
- `package-lock.json` — точные версии зависимостей, прочитано node-командой 2026-11-20.
- `eslint.config.js:8-22`, `tsconfig.app.json:1-26` — линтер и TypeScript-настройки (`noUnusedLocals`, `verbatimModuleSyntax`), прочитано 2026-11-20.
- `node_modules/json-server/lib/parse-where.js:32-44`, `matches-where.js:47` — приведение query к числу и строгое сравнение; live `GET /users?id=1` → `[]`, 2026-11-20.
- `D:\opencode\tmp\opencode\tag-dropdown-test.mjs:94-192,541-584,691-762` — фикстуры, fetch-shim, task 9 и хвост задач, прочитано 2026-11-20.
- Precedents: `src/pages/notesPage.tsx:25-78` (запрос списка, `error`, удаление), `src/pages/NoteViewPage.tsx:11-34` (одна загрузка + сообщения), `src/pages/EditNotePage.tsx:81-133` (загрузка + PATCH), `src/pages/CreateNotePage.tsx:11-30` (POST) — прочитано 2026-11-20.

## Convention catalogue (shadow these precedents)

| Dimension | Convention | Precedent |
|---|---|---|
| Placement | страницы в `src/pages/`, компоненты в `src/components/`, хуки в `src/hooks/`, общие типы/хелперы в корне `src/` | `src/pages/*.tsx`, `src/utils.ts` |
| File naming | страницы/компоненты PascalCase (исключение — существующий `notesPage.tsx`), хуки camelCase | `NoteViewPage.tsx`, `authContext.ts` |
| Exports | страницы — default export; хелперы и константы — named export | `src/pages/NoteViewPage.tsx:6`, `src/utils.ts:3` |
| Errors | локальный `error: string` + красный `<p>` с одинаковыми Tailwind-классами | `src/pages/notesPage.tsx:91-95` |
| Data access | прямой `fetch` в странице через `DB_LINK`; обёрток нет | `src/pages/notesPage.tsx:36` |
| State | локальный `useState`; авторизация через `useAuthContext()` | `src/pages/notesPage.tsx:10-16` |
| Styling | Tailwind utility-классы, произвольные значения в `[]`; без inline `style` | `src/pages/ErrorBoundary.tsx:29-35` |
| Tests | внешний CDP-харнес, `caseRun` + `eq`/`ok`/`waitFor`, `--task=N`; в репозитории тестов нет | харнес `:232-762` |
| Commits | Conventional Commits (`feat:`, `fix:`, `docs:`) | `git log` ветки `hw3` |

## File Map

| File | Action | Responsibility |
|---|---|---|
| `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` | Modify (outside repo) | фикстуры с `authorId`, task 16–20, обновление task 9, DELETE-vетка shim |
| `src/types.ts` | Modify: `1-17` | добавить опциональный `authorId` в `Note` и `NoteDTO` |
| `src/utils.ts` | Modify: `1-14` | общая константа сообщения, preservation `authorId` |
| `src/pages/LoginPage.tsx` | Modify: `32-41` | один пользователь в `setUser` |
| `src/pages/CreateNotePage.tsx` | Modify: `7-30` | `authorId: user.id` в POST |
| `src/pages/notesPage.tsx` | Modify: `25-50`, `66-74` | клиентская фильтрация + guard удаления |
| `src/pages/NoteViewPage.tsx` | Modify: `7-34` | блокировка чужой заметки |
| `src/pages/EditNotePage.tsx` | Modify: `66-110`, `112-133` | блокировка чужой формы и PATCH |
| `db.json` | Modify locally, never stage | `authorId: "1x"` → `"1"` у 7 заметок |
| `.godmode/runs/2026-11-20-note-ownership-plan/*.log` | Create (git-ignored) | красные/зелёные прогоны |

## Task 1: красные тесты во внешнем харнесе

**Files:**
- Modify: `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` (вне репозитория; коммит не требуется)

**Covers:** acceptance criteria 1–6 дизайна на уровне ожиданий.

**Interfaces:**
- Produces: `--task=9` (обновлённое утверждение), `--task=16` — список, `--task=17` — создание, `--task=18` — просмотр, `--task=19` — редактирование, `--task=20` — удаление.

- [ ] **Step 1: обновить фикстуры (`:95-103`)**

Добавить `authorId: "1"` в каждый объект базовых заметок и в task-specific (`edit-note-1`, `view-note-1`, `crash-note-1`). Для `task === "16" || ... || "20"` добавить объект `{ id: "foreign-note-1", authorId: "2", title: "Foreign note", content: "Foreign body", createdAt: "2026-01-06T00:00:00.000Z", hidden: false, tags: ["work"] }`. Чужой владелец `"2"` не совпадает с текущим пользователем `"1"` из `:105`.

- [ ] **Step 2: добавить DELETE-ветку в shim (`:138-166`)**

Перед финальным `return` блока `/notes`: если `method === "DELETE"`, найти заметку по id из `pathname`, удалить её из `fixture`, вернуть `Response(JSON.stringify({}), {status:200, headers:{"Content-Type":"application/json"}})`. `window.__fetchLog` уже пишет `method + " " + url`, отдельного логирования не нужно.

- [ ] **Step 3: обновить assertion task 9 (`:572`)**

Заменить `eq("login stores an array", await evaluate('Array.isArray(JSON.parse(localStorage.user))'), true)` на `eq("login stores a single user", await evaluate("JSON.parse(localStorage.user)"), { id: "3", email: "numeric@example.com", password: "1111" })`. Старое утверждение фиксировало баг.

- [ ] **Step 4: добавить задачи 16–20 после блока task 15 (до `:760`)**

  - `caseRun("task16 own notes only", ...)`: `Page.navigate` на `${base}/notes`; `waitFor("document.querySelectorAll('article').length", 4, "own notes loaded")`; `eq` число статей 4; `ok` что `document.body.textContent` не содержит `"Foreign note"`; `ok` что нет `a[href="/notes/foreign-note-1"]`; `ok` что нет кнопки `Delete` в карточке с чужой заметкой (карточек 4, чужая не рендерится).
  - `caseRun("task17 create owner", ...)`: `Page.navigate` на `${base}/create`; заполнить `input[placeholder="Title"]` и `textarea[placeholder="Content"]` через нативный setter + `input`-событие (как в task 9); клик `form button[type="submit"]`; `waitFor("window.__postBody !== null", true, "post captured")`; `eq("post author id", await evaluate("window.__postBody.authorId"), "1")`; `waitFor("location.pathname", "/notes", "redirect after create")`.
  - `caseRun("task18 foreign view", ...)`: `Page.navigate` на `${base}/notes/foreign-note-1`; `waitFor('document.body.textContent.includes("You can only work with your own notes.")', true, "access message")`; `eq` `h1` равен `"View note"`; `ok` нет `#view-body`; `ok` нет `"Foreign body"`; `ok` нет `a[href="/notes/foreign-note-1/edit"]`.
  - `caseRun("task19 foreign edit", ...)`: `Page.navigate` на `${base}/notes/foreign-note-1/edit`; `waitFor` тот же текст доступа; `ok` нет `#edit-title`; `eq("no PATCH", await evaluate('window.__fetchLog.filter(x => x.startsWith("PATCH")).length'), 0)`.
  - `caseRun("task20 delete regression", ...)`: `Page.navigate` на `${base}/notes`; `waitFor` 4 статьи; найти карточку с текстом `"Alpha work"` и кликнуть её кнопку `Delete`; `waitFor('window.__fetchLog.some(x => x.startsWith("DELETE"))', true, "delete sent")`; `eq` число статей стало 3; `eq("no foreign delete", await evaluate('window.__fetchLog.filter(x => x.includes("foreign-note-1")).length'), 0)`.

- [ ] **Step 5: зафиксировать красный прогон**

Run (для каждого N из 9,16,17,18,19; для task 20 — отдельно, см. ожидание): `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=<N>`
Expected: `--task=9` → `FAIL login stores a single user` (сейчас массив); `--task=16` → `FAIL own notes loaded` (видна 5-я статья); `--task=17` → `FAIL post author id` (поле отсутствует); `--task=18`/`--task=19` → `FAIL access message` (показываются данные/форма); `--task=20` → **зелёный уже сейчас** (это регрессионный sentinel: чужая карточка не рендерится и после реализации). Логи `task-N-red.log` в `.godmode/runs/2026-11-20-note-ownership-plan/`. Коммит не нужен: харнес вне репозитория.

## Task 2: типы, константа и исправление логина

**Files:**
- Modify: `src/types.ts:1-17`, `src/utils.ts:1-14`, `src/pages/LoginPage.tsx:32-41`

**Covers:** Review Focus 3; acceptance criterion «после логина один объект».

**Interfaces:**
- Produces: `Note.authorId?: string`, `NoteDTO.authorId?: string` (`src/types.ts`); `OWN_NOTES_ONLY_MESSAGE: string` (`src/utils.ts`), используется Tasks 3–5; `mapNoteFromDTO` теперь копирует `authorId`.
- Consumes: `useAuthContext()` из `src/hooks/authContext.ts`.

- [ ] **Step 1: добавить поле в типы**

В `src/types.ts` добавить `authorId?: string` в `Note` и `NoteDTO`. Обязательным поле быть не может: `CreateNoteForm.tsx:86-93` (запрещён к изменению) создаёт `Note` без него, и `tsc` упадёт.

- [ ] **Step 2: добавить общий текст и сохранить владельца при маппинге**

В `src/utils.ts` экспортировать `export const OWN_NOTES_ONLY_MESSAGE = "You can only work with your own notes."` и добавить `authorId: note.authorId` в объект `mapNoteFromDTO`.

- [ ] **Step 3: исправить `LoginPage`**

В `handleLogin` заменить `users.some(...)` + `setUser(users)` на `const matched = users.find((u) => u.password === data.password && typeof u.id === "string" && u.id)`; если найден — `setUser({ id: matched.id, email: String(matched.email), password: String(matched.password) })` и `navigate("/notes")`; иначе прежнее `setServerError("Неверный email или пароль")`. При нескольких совпадениях `find` берёт первого. Формат ответа `users` — массив из `GET /users?email=...`, проверено в харнесе `:167-180`.

- [ ] **Step 4: зелёный прогон task 9**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=9`
Expected: exit 0, `task=9: <n> passed, 0 failed`, включая `login stores a single user`. Лог `task-9-green.log`.

- [ ] **Step 5: коммит**

```bash
git add src/types.ts src/utils.ts src/pages/LoginPage.tsx
git commit -m "fix: store a single user on login"
```

## Task 3: владелец при создании

**Files:**
- Modify: `src/pages/CreateNotePage.tsx:7-30`

**Covers:** acceptance criterion «новая заметка с authorId вошедшего».

**Interfaces:**
- Consumes: `OWN_NOTES_ONLY_MESSAGE` из Task 2; `useAuthContext()`; `Note` из `src/types.ts`; `handleSubmit(note: Note): Promise<boolean>` — сигнатура `CreateNoteForm` не меняется.
- Produces: POST body `{ ...note, authorId: user.id }`.

- [ ] **Step 1: подключить контекст и передать владельца**

Добавить `import { useAuthContext } from "../hooks/authContext"` и `const { user } = useAuthContext()` в `CreateNotePage`. В `handleSubmit` перед `fetch`: если `!user`, `setError(OWN_NOTES_ONLY_MESSAGE)` и `return Promise.resolve(false)`. Иначе `body: JSON.stringify({ ...note, authorId: user.id })`. Остальные `.then/.catch` не трогать.

- [ ] **Step 2: зелёный прогон task 17**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=17`
Expected: exit 0, `task=17: <n> passed, 0 failed`, `post author id` равен `"1"`. Лог `task-17-green.log`.

- [ ] **Step 3: коммит**

```bash
git add src/pages/CreateNotePage.tsx
git commit -m "feat: assign note owner on create"
```

## Task 4: список только своих и guard удаления

**Files:**
- Modify: `src/pages/notesPage.tsx:25-50`, `src/pages/notesPage.tsx:66-74`

**Covers:** acceptance criteria «список только своих» и «guard удаления»; Review Focus 1, 2, 4.

**Interfaces:**
- Consumes: `OWN_NOTES_ONLY_MESSAGE` из Task 2; `user` из `useAuthContext()` (уже импортирован); `mapNoteFromDTO`.
- Produces: отфильтрованный массив `Note[]` в `setNotes`; `handleDelete(id: string)` с проверкой владельца.

- [ ] **Step 1: фильтровать список на клиенте**

В `refetchNotes`: если `!user`, вернуть `Promise.resolve()` без запроса. Иначе оставить текущий `fetch(`${DB_LINK}/notes${query}`)` (без query `authorId`) и в `.then((data: NoteDTO[]) => setNotes(data.map(mapNoteFromDTO).filter((note) => note.authorId === user.id)))`. В `useEffect` заменить массив зависимостей на `[filters, user?.id]`, комментарий `eslint-disable-next-line react-hooks/exhaustive-deps` оставить. Блок `selectedTags.every(...)` (`:59-64`) и `onTagsChange={setSelectedTags}` (`:89`) не трогать.

- [ ] **Step 2: guard удаления**

В `handleDelete(id)` перед `fetch` добавить: `const note = notes.find((item) => item.id === id)`; если `!note || note.authorId !== user?.id`, выполнить `setError(OWN_NOTES_ONLY_MESSAGE)` и `return`. Оригинальный `fetch`/`.then`/`.catch` оставить без изменений.

- [ ] **Step 3: зелёные прогоны task 16 и task 20**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=16`
Expected: exit 0, `task=16: <n> passed, 0 failed`, ровно 4 статьи, чужого заголовка нет.
Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=20`
Expected: exit 0 (был зелёным и остаётся), `task=20: <n> passed, 0 failed`. Логи `task-16-green.log`, `task-20-green.log`.

- [ ] **Step 4: коммит**

```bash
git add src/pages/notesPage.tsx
git commit -m "feat: show only own notes and guard delete"
```

## Task 5: блокировка чужого просмотра и редактирования

**Files:**
- Modify: `src/pages/NoteViewPage.tsx:7-34`, `src/pages/EditNotePage.tsx:66-110`

**Covers:** acceptance criteria «чужой просмотр/редактирование»; Review Focus 2, 5.

**Interfaces:**
- Consumes: `OWN_NOTES_ONLY_MESSAGE` из Task 2; `useAuthContext()`; `mapNoteFromDTO`; `reset` из `react-hook-form` (уже в `EditNotePage`).
- Produces: `error === OWN_NOTES_ONLY_MESSAGE` и отсутствие рендера данных/формы для чужой заметки.

- [ ] **Step 1: `NoteViewPage`**

Подключить `useAuthContext()` и получить `user`. В `.then((loaded) => ...)` после проверки `active`: если `loaded.authorId !== user?.id`, вызвать `setError(OWN_NOTES_ONLY_MESSAGE)` и `return` (без `setNote`). Иначе прежний `setNote(loaded)`. Заголовок остаётся динамическим (`note ? note.title : "View note"`) — при отказе будет «View note». Блок `<article>` уже conditioned on `note`, новые стили не нужны.

- [ ] **Step 2: `EditNotePage`**

Подключить `useAuthContext()`. В `.then((note) => ...)` после проверки `active`: если `note.authorId !== user?.id`, вызвать `setError(OWN_NOTES_ONLY_MESSAGE)` и `return` (без `reset` и `setLoaded`). Добавить `user?.id` в массив зависимостей `useEffect` (`:110`), оставив `id, reset`. `onFormSubmit` (`:112-133`) не трогать: форма для чужой заметки не рендерится, поэтому `PATCH` не состоится.

- [ ] **Step 3: зелёные прогоны task 18 и task 19**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=18`
Expected: exit 0, `task=18: <n> passed, 0 failed`, текст доступа виден, `#view-body` отсутствует.
Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=19`
Expected: exit 0, `task=19: <n> passed, 0 failed`, `#edit-title` отсутствует, `no PATCH` пройден. Логи `task-18-green.log`, `task-19-green.log`.

- [ ] **Step 4: коммит**

```bash
git add src/pages/NoteViewPage.tsx src/pages/EditNotePage.tsx
git commit -m "feat: block foreign note view and edit"
```

## Task 6: полный прогон, локальные данные и финальное ревью

**Files:**
- Modify locally: `db.json` (никогда не добавлять в `git add`)
- Create: `.godmode/runs/2026-11-20-note-ownership-plan/task-N-final.log`, `build-final.log`, `lint-final.log` (git-ignored)

**Covers:** все acceptance criteria; Review Focus 1–5.

**Interfaces:**
- Consumes: `--task=1..20` из Tasks 1–5.

- [ ] **Step 1: переназначить сид-заметки локально**

В `db.json` заменить все 7 вхождений `"authorId": "1x"` на `"authorId": "1"`. Проверить `git status --porcelain`: `db.json` должен оставаться **непроиндексированным**; в коммит его не включать.

- [ ] **Step 2: регресс tasks 1–20**

Run: для N от 1 до 20 (task 4 с `--empty`) `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=<N>`
Expected: все exit 0, каждая строка `task=<N>: <n> passed, 0 failed`. Логи `task-N-final.log`.

- [ ] **Step 3: качество**

Run: `npm run build`, затем `npm run lint`
Expected: exit 0 у обоих; логи `build-final.log`, `lint-final.log`.

- [ ] **Step 4: финальное ревью и ledger**

Dispatch: `godmode:code-review` на diff от `ecd3213` до HEAD, затем `godmode:completion-gate`. Результат записать в `.godmode/runs/2026-11-20-note-ownership-plan/final-review.md` и `progress.md`. Коммит в этой задаче не требуется: репозиторийские файлы уже закоммичены в Tasks 2–5, `db.json` коммитить запрещено.

## Handoff

Plan saved to `docs/plans/2026-11-20-note-ownership-plan.md`: 6 tasks. Рекомендую **inline execution** — задачи последовательные, короткие, все работают с одним харнесом и одним checkout; контекст удерживается. Delegated execution — альтернатива, если нужен свежий ревьюер между задачами. Workspace isolation не нужна: работа уже идёт в ветке `hw3`, dev-серверы и харнес привязаны к этому checkout.
