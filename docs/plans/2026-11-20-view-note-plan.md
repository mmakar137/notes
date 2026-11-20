# View Note Implementation Plan

> For the executing agent: use godmode:inline-execution to run this plan task by task.
> Steps use checkboxes for tracking.

**Goal:** добавить страницу `/notes/:id` с корректным отображением тела заметки и переходами из карточки.
**Design:** docs/plans/2026-11-20-view-note-design.md
**Architecture:** `NoteCard.tsx` получает две точки входа (кликабельный заголовок и ссылку View). `NoteViewPage.tsx` загружает заметку по id через GET, рендерит карточку чтения и выводит `note.content` в `<p className="whitespace-pre-wrap break-words">`. Маршрут живёт внутри `Layout`, поэтому страница доступна только авторизованным.

**Stack:** React 19 + TypeScript, react-router `8.5.0`, Tailwind `4.3.3`, json-server `1.0.0-beta.15`, scratch-CDP-харнесс `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`.

## Global Constraints
- Не менять `src/components/CreateNoteForm.tsx` и `src/components/NoteFilterForm.tsx`.
- Не менять `onTagsChange(tags: string[])` и `selectedTags.every(...)`.
- Не трогать дублирующий маршрут `/notes` в `App.tsx`.
- Только Tailwind; без CSS-модулей, inline-стилей и новых зависимостей.
- Не коммитить `db.json`; push не делать без отдельной просьбы.
- Тесты: каждый `--task` запускается отдельным процессом; task 4 требует `--empty`.

## Review Focus
- `content` с `\n` и пустой строкой: ожидается несколько визуальных строк, `white-space: pre-wrap`, без потери символов перевода строки.
- Клик по заголовку карточки: ожидается переход на ту же страницу, что и по кнопке View.
- 404 при загрузке: ожидается `Note not found.` и отсутствие пустой карточки.
- Ошибка GET (500/сеть): ожидается `Could not load note. Is the server running (npm run db)?`.
- Переход Edit со страницы просмотра: ожидается `/notes/<id>/edit` с той же заметкой.

## Sources
- `docs/plans/2026-11-20-view-note-design.md` — утверждённый дизайн, 2026-11-20.
- `docs/plans/2026-11-20-edit-note-design.md:12-18` — проверенные версии и API, 2026-11-20.
- `src/components/NoteCard.tsx:18-20,48,52-58` — текущие заголовок, тело и действия, 2026-11-20.
- `src/pages/EditNotePage.tsx:81-110` — образец загрузки и ошибок, 2026-11-20.

## File Map
| File | Action | Responsibility |
|---|---|---|
| `src/components/NoteCard.tsx` | Modify | кликабельный заголовок и ссылка View |
| `src/pages/NoteViewPage.tsx` | Create | загрузка заметки, карточка чтения, ошибки |
| `src/App.tsx` | Modify | маршрут `/notes/:id` внутри `Layout` |
| `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` | Modify (вне репозитория) | task 11 и фикстура с переводами строк |

### Task 1: переходы из карточки

**Files:**
- Modify: `src/components/NoteCard.tsx:18-20` и `:52-66`
- Test: `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`, новый `task === "11"` блок и initial wait

**Covers:** критерии 1 и 2.

**Interfaces:**
- Produces: `a[href="/notes/view-note-1"]` в заголовке карточки и `a` с текстом `View` в строке действий.
- Consumes Task 2: тот же id из URL.

- [ ] **Step 1: добавить фикстуру и тест переходов в task 11**

В массив `fixture` добавить только при `task === "11"`:
```js
{ id:"view-note-1", title:"Viewable note", content:"Line one\nLine two\n\nLine four", createdAt:"2026-02-01T00:00:00.000Z", hidden:false, tags:["work"] },
```
В initial wait (строка ~171) добавить `|| task === "11"`. Тест:
```js
if (task === "11" || task === "all") {
  await caseRun("task11 view links", async () => {
    const base = (process.env.TEST_URL || "http://localhost:5176/notes").replace(/\/(notes|create|login)$/, "")
    await send("Page.navigate", { url: `${base}/notes` })
    await waitFor("document.querySelectorAll('article').length", 5, "notes with view fixture")
    ok("title links to view", await evaluate(`[...document.querySelectorAll('article h2 a')].some(a => a.textContent.trim() === "Viewable note" && a.getAttribute("href") === "/notes/view-note-1")`))
    ok("view button on card", await evaluate(`[...document.querySelectorAll('article a')].some(a => a.textContent.trim() === "View" && a.getAttribute("href") === "/notes/view-note-1")`))
  })
}
```
Правило: фикстура добавляется только для `--task=11`, не для `all`, чтобы не ломать ожидание 4 карточек в tasks 1–9.

- [ ] **Step 2: красный прогон**

Run: `$env:TEST_URL='http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=11`
Expected: `FAIL title links to view`, `FAIL view button on card`, `task=11: 0 passed, 2 failed`.

- [ ] **Step 3: добавить ссылки в `NoteCard.tsx`**

Заменить содержимое `h2` (строки 18-20) на `<h2 className="text-center text-lg font-semibold break-words text-slate-900"><Link to={`/notes/${note.id}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">{note.title}</Link></h2>`. В строке действий (строки 52-58) перед Edit добавить `<Link to={`/notes/${note.id}`} className="rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-[#2563eb] transition-colors duration-200 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">View</Link>`. Delete и Edit не трогать.

- [ ] **Step 4: зелёный прогон**

Run: та же команда. Expected: `PASS title links to view`, `PASS view button on card`, `task=11: 2 passed, 0 failed`.

- [ ] **Step 5: коммит**

`git add src/components/NoteCard.tsx && git commit -m "feat: link note titles and add view button"`.

### Task 2: страница просмотра

**Files:**
- Create: `src/pages/NoteViewPage.tsx`
- Modify: `src/App.tsx` (импорт и маршрут рядом с `/notes/:id/edit`)
- Test: тот же task 11, второе и третье `caseRun`

**Covers:** критерии 3–6 и Review Focus.

**Interfaces:**
- Consumes: `useParams` и `Link` из `react-router`, `DB_LINK`/`mapNoteFromDTO` из `src/utils.ts`, `NoteDTO` из `src/types.ts`.
- Produces: GET `http://localhost:3000/notes/view-note-1`; `#view-body` с текстом заметки.

- [ ] **Step 1: добавить тесты загрузки, переносов строк и 404**

```js
await caseRun("task11 view page load", async () => {
  const base = (process.env.TEST_URL || "http://localhost:5176/notes").replace(/\/(notes|create|login)$/, "")
  await send("Page.navigate", { url: `${base}/notes/view-note-1` })
  await waitFor("!!document.querySelector('#view-body')", true, "view body mounted")
  eq("view fetch exact", await evaluate(`window.__fetchLog.includes("GET http://localhost:3000/notes/view-note-1")`), true)
  eq("view heading", await evaluate(`document.querySelector('h1')?.textContent.trim()`), "Viewable note")
  eq("view body text", await evaluate(`document.querySelector('#view-body')?.textContent`), "Line one\nLine two\n\nLine four")
  eq("view body pre-wrap", await evaluate(`getComputedStyle(document.querySelector('#view-body')).whiteSpace`), "pre-wrap")
  const rects = await evaluate(`(() => { const p=document.querySelector('#view-body'); const r=document.createRange(); r.selectNodeContents(p); return r.getClientRects().length; })()`)
  ok("view body spans multiple lines", rects >= 3)
  ok("view edit link", await evaluate(`!!document.querySelector('a[href="/notes/view-note-1/edit"]')`))
})
await caseRun("task11 view not found", async () => {
  const base = (process.env.TEST_URL || "http://localhost:5176/notes").replace(/\/(notes|create|login)$/, "")
  await send("Page.navigate", { url: `${base}/notes/missing` })
  await waitFor(`document.body.textContent.includes("Note not found.")`, true, "view not found shown")
  eq("view not found message", await evaluate(`document.body.textContent.includes("Note not found.")`), true)
  eq("view not found has no body", await evaluate(`!!document.querySelector('#view-body')`), false)
})
```

- [ ] **Step 2: красный прогон**

Run: task 11. Expected: `FAIL view body mounted: timed out`, `FAIL view fetch exact`, `FAIL view not found message` — страница ещё не существует.

- [ ] **Step 3: реализовать `NoteViewPage.tsx` и маршрут**

`NoteViewPage`: `useParams()` → `id`; `useEffect` с `active`-флагом, `fetch(`${DB_LINK}/notes/${encodeURIComponent(id ?? "")}`)`; `res.status === 404` → `Error("NOT_FOUND")`, `!res.ok` → `Error("LOAD_FAILED")`, иначе `mapNoteFromDTO(await res.json())`; в `.then` (async callback, не синхронно в теле effect) записать заметку в состояние; в `.catch` установить `Note not found.` или `Could not load note. Is the server running (npm run db)?`. Разметка: общий контейнер и заголовок как в `src/pages/CreateNotePage.tsx:33-41`; карточка с датой `<time dateTime={note.createdAt.toISOString()}>`, бейджем Hidden/Visible, тегами и `<p id="view-body" className="whitespace-pre-wrap break-words ...">`; ссылка Edit на `/notes/${note.id}/edit`. В `App.tsx` добавить импорт и `{ path: "/notes/:id", element: <NoteViewPage /> }` внутри children `Layout` перед `/notes/:id/edit`. Не менять дублирующий маршрут `/notes`.

- [ ] **Step 4: зелёный прогон и регресс**

Run: task 11; затем tasks 1–10 по одному (task 4 с `--empty`); `npm run build`; `npm run lint`. Expected: task 11 без падений, tasks 1–10 зелёные, build/lint exit 0.

- [ ] **Step 5: коммит**

`git add src/pages/NoteViewPage.tsx src/App.tsx && git commit -m "feat: add note view page with preserved line breaks"`.

## Handoff
Plan saved. Рекомендую inline execution: 2 задачи, последовательные, контекст помещается. Delegated execution — альтернатива, если нужна проверка между задачами.
