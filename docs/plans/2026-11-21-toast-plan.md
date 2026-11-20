# Toast client state — Implementation Plan

> For the executing agent: use `godmode:inline-execution` to run this plan task by task.
> Steps use checkboxes for tracking.

**Goal:** добавить Zustand-стор уведомлений, компонент `Toaster` и вызвать его из всех согласованных успешных действий.
**Design:** `docs/plans/2026-11-21-toast-design.md` (одобрен пользователем 2026-11-21).
**Architecture:** `useToastStore` хранит `{id, message}[]`; `Toaster` рендерит стек в `App.tsx` один раз на весь роутер; страницы и кнопки добавляют тост перед навигацией. Таймер автоскрытия живёт в `ToastItem`, а не в сторе.

**Stack:** React 19.2.8, Zustand 5.1.0, Tailwind CSS 4.3.3, TypeScript 6.0.2, Vite 8.3.1, ESLint 10.10.0 (versions from `package.json`, read 2026-11-21).

## Global Constraints

- Говорить по-русски; все тексты интерфейса — на английском.
- Никаких новых зависимостей; только Zustand + Tailwind. Без CSS-модулей и inline `style={{...}}`.
- Узкие селекторы (`useToastStore((s) => s.toasts)`), без деструктурирования всего стора.
- Тесты в репозиторий **не добавлять**; все проверки — во внешнем CDP-харнесе `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`.
- `docs/plans/` и `.godmode/` остаются локальными, в `git add` не попадают.
- Агент не коммитит и не пушит: каждая задача заканчивается `git add` нужных файлов; коммит, подпись и пуш выполняет пользователь.
- Dev-сервер для харнеса: `http://localhost:5176/notes`. Команда задачи: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=<N>`.

## Review Focus

| Input class | Expected behaviour | Test owner |
|---|---|---|
| 4 быстрых действия подряд | видно не более 3 тостов, самый старый вытеснен | Task 1 / Task 6 |
| Навигация сразу после действия | тост не исчезает при смене роута | Task 4 |
| StrictMode двойной mount | таймер первого эффекта очищен, тост живёт 3 с | Task 6 |
| Клавиатура | Tab до `Dismiss notification`, Enter закрывает | Task 6 |
| Тёмная тема | токены `surface`/`text`/`border`, контраст, без inline style | Task 6 |
| Пустое состояние | live region есть, `[data-toast]` элементов нет | Task 3 |

## Sources

- Design: `docs/plans/2026-11-21-toast-design.md` (одобрен 2026-11-21).
- Internal precedents (read 2026-11-21): `src/store/authState.ts`, `src/store/favoritesState.ts`, `src/store/themeState.ts`, `src/components/NoteCard.tsx`, `src/App.tsx`, `src/main.css`.
- External alternatives, inspected but rejected (2026-11-21): https://sonner.emilkowal.ski/ , https://react-hot-toast.com/ .

## File Map

| File | Action | Responsibility |
|---|---|---|
| `docs/plans/2026-11-21-toast-plan.md` | Create | этот план |
| `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` | Modify | задачи 31–36 (внешний харнес, не в репозитории) |
| `src/store/toastState.ts` | Create | `Toast`, `ToastState`, `useToastStore` |
| `src/components/Toaster.tsx` | Create | live region, стек тостов, кнопка закрытия, таймер |
| `src/App.tsx` | Modify | один раз смонтировать `<Toaster />` рядом с `RouterProvider` |
| `src/pages/CreateNotePage.tsx` | Modify | `Note "${title}" created` |
| `src/pages/EditNotePage.tsx` | Modify | `Note "${title}" updated` |
| `src/pages/notesPage.tsx` | Modify | `Note "${title}" deleted` |
| `src/components/NoteCard.tsx` | Modify | `Added/Removed "${title}" to/from favorites` |
| `src/pages/LoginPage.tsx` | Modify | `Signed in` |
| `src/pages/RegisterPage.tsx` | Modify | `Account created` |
| `src/pages/Layout.tsx` | Modify | `Signed out`, `Dark/Light mode enabled` |

---

### Task 1: external harness — failing tests 31–36

**Files:** Modify `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`.
**Covers:** все acceptance criteria из дизайна.

**Interfaces:**
- Produces: задачи `31`–`36`, запускаемые через `--task=<N>`; каждая печатает `task=N: X passed, Y failed`.

- [ ] **Step 1: добавить в инъекциюFixture два helpers и фикстуру для task 32**

В `source` рядом с `setTheme` добавить `function toasts() { return [...document.querySelectorAll('[data-toast]')].map(el => el.textContent.trim()) }`.
В `fixture` добавить запись для `task === "32"`: `{ id: "edit-note-1", authorId: "1", title: "Editable note", content: "Original body", createdAt: "2026-01-05T00:00:00.000Z", hidden: false, tags: ["work"] }`.
В строке исключения темы (сейчас `["26", "27", "28", "29", "30"]`) добавить `"34"`, `"35"`, `"36"`.

- [ ] **Step 2: написать task 31 — mount + empty state**

Перейти на `/login` с `noUser`, проверить: `document.querySelectorAll('[role="status"][aria-live="polite"]').length === 1`, `document.querySelectorAll('[data-toast]').length === 0`, `document.querySelector('[role="status"]')?.hasAttribute("style") === false`. Затем снять `noUser`, перейти на `/notes`, снова проверить 0 тостов.

- [ ] **Step 3: написать task 32 — CRUD**

Создать заметку "Toast created" через форму `/create`, дождаться `/notes`, проверить, что `toasts()` содержит `Note "Toast created" created`. Открыть `/notes/edit-note-1/edit`, изменить title на `Toast edited`, отправить и проверить `Note "Toast edited" updated`. На `/notes` нажать Delete у `Alpha work` и проверить `Note "Alpha work" deleted`.

- [ ] **Step 4: написать task 33 — favorites**

Сбросить `localStorage.favorites`, перейти на `/notes`, кликнуть звезду `Alpha work`, дождаться текста `Added "Alpha work" to favorites`; кликнуть ещё раз, дождаться `Removed "Alpha work" to favorites`.

- [ ] **Step 5: написать task 34 — auth/theme**

С `noUser` на `/login` ввести `admin@email.com` / `admin`, дождаться `Signed in`. На `/notes` нажать Logout, дождаться `Signed out`. Снова войти, нажать кнопку темы, дождаться `Dark mode enabled`, нажать ещё раз — `Light mode enabled`. Отдельно на `/register` зарегистрировать `toast@example.com` / `secret`, дождаться `Account created`.

- [ ] **Step 6: написать task 35 — stack, dismiss, auto-hide**

На `/notes` кликнуть звёзды у всех четырёх заметок подряд. Проверить `document.querySelectorAll('[data-toast]').length === 3`, что в стеке нет `Alpha work`, но есть `Delta both`. Кликнуть первую кнопку `button[aria-label="Dismiss notification"]`, проверить длину 2. Затем сфокусировать оставшуюся кнопку и нажать Enter (`key("Enter", "Enter", 13, "\r")`), проверить длину 1. Подождать 3200 мс и проверить длину 0.

- [ ] **Step 7: написать task 36 — dark theme и консоль**

Установить `theme` в `{"state":{"isDark":true},"version":0}`, перейти на `/notes`, дождаться `document.documentElement.classList.contains("dark")`. Вызвать тост через звезду, проверить computed `backgroundColor` тоста равен `rgb(30, 41, 59)` (токен `--color-surface` в `.dark`), `color` равен `rgb(248, 250, 252)`, `hasAttribute("style") === false`, `window.__consoleErrors.length === 0`.

- [ ] **Step 8: запустить все шесть задач и зафиксировать красный результат**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; foreach ($i in 31..36) { node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' "--task=$i" 2>&1 | Select-String 'task=|FAIL' | Select-Object -Last 4 }`
Expected: каждая задача печатает `task=N: ... failed > 0`; типичная причина — `timed out waiting for ...` у `[data-toast]` / тост-текста. Это доказательство, что тесты проверяют недостающее поведение.

- [ ] **Step 9: stage внешний файл (не коммитить)**

Run: `git status --short` (должно быть пусто — харнес вне репозитория).

---

### Task 2: store `useToastStore`

**Files:** Create `src/store/toastState.ts`.
**Covers:** acceptance criteria 1.

**Interfaces:**
- Produces: `interface Toast { id: string; message: string }`, `interface ToastState { toasts: Toast[]; addToast: (message: string) => void; dismissToast: (id: string) => void }`, `export const useToastStore`.
- Consumed by: Task 3.

- [ ] **Step 1: написать стор по образцу `src/store/favoritesState.ts`**

`create<ToastState>()((set) => ({ ... }))` без `persist`. Начальное `toasts: []`. `addToast(message)` добавляет `{ id: crypto.randomUUID(), message }` в конец и обрезает `.slice(-3)`. `dismissToast(id)` оставляет записи с другим id. Интерфейс `ToastState` не экспортировать — как в соседних сторах.

- [ ] **Step 2: проверить типы**

Run: `npx tsc -b`
Expected: exit 0, ошибок нет.

- [ ] **Step 3: stage**

Run: `git add src/store/toastState.ts`.

---

### Task 3: `Toaster` и монтирование в `App.tsx`

**Files:** Create `src/components/Toaster.tsx`; Modify `src/App.tsx:100-104`.
**Covers:** acceptance criteria 2, 7, 8.

**Interfaces:**
- Consumes: `useToastStore` из Task 2.
- Produces: `export default function Toaster()`; рендерит elements с `data-toast` и `data-toast-id`.

- [ ] **Step 1: написать `Toaster.tsx`**

Импортировать `useEffect` и `useToastStore`. Контейнер: `<div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-80">`. Каждый тост — `<div data-toast data-toast-id={id} className="pointer-events-auto rounded-[10px] border border-[var(--color-border)] border-l-4 border-l-emerald-500 bg-[var(--color-surface)] px-4 py-3 text-[0.9rem] text-[var(--color-text)] shadow-md">`. Внутри: `<span>{message}</span>` и `<button type="button" aria-label="Dismiss notification" className="... focus-visible:outline-2 ..." onClick={() => dismissToast(id)}>` с SVG-крестиком `aria-hidden="true"`. Внутренний `ToastItem` ставит `setTimeout(() => dismissToast(id), 3000)` в `useEffect` и возвращает `clearTimeout`.

- [ ] **Step 2: смонтировать в `App.tsx`**

Добавить импорт `Toaster` и поместить `<Toaster />` как первого ребёнка внешнего `ErrorBoundary`, перед `<RouterProvider router={router} />`. Не трогать внутренний `ErrorBoundary` в роутере.

- [ ] **Step 3: запустить task 31**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=31`
Expected: `task=31: 4 passed, 0 failed` (или больше, если добавите дополнительные eq).

- [ ] **Step 4: stage**

Run: `git add src/components/Toaster.tsx src/App.tsx`.

---

### Task 4: CRUD call sites

**Files:** Modify `src/pages/CreateNotePage.tsx:24-35`, `src/pages/EditNotePage.tsx:118-139`, `src/pages/notesPage.tsx:74-88`.
**Covers:** acceptance criterion 3.

**Interfaces:**
- Consumes: `useToastStore` из Task 2.

- [ ] **Step 1: create**

В `CreateNotePage` узкий селектор `const addToast = useToastStore((state) => state.addToast)`. В успешной ветке после `res.json()` и перед `navigate("/notes")` вызвать `addToast(\`Note "${note.title}" created\`)`.

- [ ] **Step 2: edit**

В `EditNotePage` добавить тот же селектор. После проверки `res.ok` и перед `navigate("/notes")` вызвать `addToast(\`Note "${data.title.trim()}" updated\`)`.

- [ ] **Step 3: delete**

В `notesPage` добавить селектор. В `handleDelete` success-ветке после `setNotes(...)` вызвать `addToast(\`Note "${note.title}" deleted\`)` — объект `note` уже найден в начале функции.

- [ ] **Step 4: запустить task 32 и task 5 (регрессия)**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=32`
Expected: `task=32: N passed, 0 failed`.
Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=5`
Expected: `task=5: N passed, 0 failed`.

- [ ] **Step 5: stage**

Run: `git add src/pages/CreateNotePage.tsx src/pages/EditNotePage.tsx src/pages/notesPage.tsx`.

---

### Task 5: favorites call site

**Files:** Modify `src/components/NoteCard.tsx:10-15,46-54`.
**Covers:** acceptance criterion 4.

**Interfaces:**
- Consumes: `useToastStore` из Task 2.

- [ ] **Step 1: добавить вызов**

В `NoteCard` взять `addToast` узким селектором. В `onClick` звезды после `toggleFavorite(note.id)` вызвать:
`addToast(isFavorite ? \`Removed "${note.title}" from favorites\` : \`Added "${note.title}" to favorites\`)`.

- [ ] **Step 2: запустить task 33 и task 21 (регрессия)**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=33`
Expected: `task=33: N passed, 0 failed`.
Run: `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=21`
Expected: `task=21: 3 passed, 0 failed`.

- [ ] **Step 3: stage**

Run: `git add src/components/NoteCard.tsx`.

---

### Task 6: auth/theme call sites + final gates

**Files:** Modify `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`, `src/pages/Layout.tsx`.
**Covers:** acceptance criteria 5, 6, 9, 10.

**Interfaces:**
- Consumes: `useToastStore` из Task 2.

- [ ] **Step 1: auth**

В `LoginPage` после `login(...)` и до `navigate("/notes")` — `addToast("Signed in")`. В `RegisterPage` после `login(...)` и до `navigate("/notes")` — `addToast("Account created")`. В `Layout` в обработчике Logout — `addToast("Signed out")` перед `logout()` (текст статичен, `_user` не нужен).

- [ ] **Step 2: theme**

В `Layout` в обработчике кнопки темы вычислить `const message = isDark ? "Light mode enabled" : "Dark mode enabled"`, затем `addToast(message)` и `toggleTheme()`. Порядок важен: сообщение отражает новое состояние.

- [ ] **Step 3: запустить tasks 34–36**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; foreach ($i in 34..36) { node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' "--task=$i" 2>&1 | Select-String 'task=|FAIL' | Select-Object -Last 4 }`
Expected: каждая задача `failed = 0`.

- [ ] **Step 4: полный харнес**

Run: `$env:TEST_URL = 'http://localhost:5176/notes'; $counts = @(); foreach ($i in 1..25) { if ($i -eq 4) { $out = node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=4 --empty 2>&1 } else { $out = node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' "--task=$i" 2>&1 }; $line = ($out | Select-String 'task=' | Select-Object -Last 1).Line; if ($line -match '^task=\d+: (\d+) passed, (\d+) failed') { $counts += [int]$Matches[1]; if ([int]$Matches[2] -gt 0) { "FAILURE: $line" } } }; foreach ($i in 26..36) { $out = node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' "--task=$i" 2>&1; $line = ($out | Select-String 'task=' | Select-Object -Last 1).Line; if ($line -match '^task=\d+: (\d+) passed, (\d+) failed') { $counts += [int]$Matches[1]; if ([int]$Matches[2] -gt 0) { "FAILURE: $line" } } }; "HARNESS PASSED=$($counts.Count) tasks, $(($counts | Measure-Object -Sum).Sum) assertions"`
Expected: `HARNESS PASSED=36 tasks`, строк `FAILURE:` нет.

- [ ] **Step 5: quality gates**

Run: `npm run lint`
Expected: exit 0, без ошибок.
Run: `npm run build`
Expected: exit 0, сборка успешна, modules > 115.

- [ ] **Step 6: stage**

Run: `git add src/pages/LoginPage.tsx src/pages/RegisterPage.tsx src/pages/Layout.tsx`
Expected: `git diff --cached --name-only` содержит только 11 файлов кода; `docs/plans/`, `.godmode/`, `db.json` отсутствуют.

---

## Self-review

- [x] Каждая acceptance criterion из дизайна покрыта задачей 1–6.
- [x] Все пути и сигнатуры точные; `useToastStore` определён до использования.
- [x] У каждой задачи есть точная команда и ожидаемый вывод.
- [x] Тесты написаны до production-кода (задача 1).
- [x] Нет зависимостей, inline style и CSS-модулей.
- [x] Коммит не делает агент — только `git add`, по требованию пользователя.
