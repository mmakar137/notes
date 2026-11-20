# Edit Note Implementation Plan

> For the executing agent: use godmode:inline-execution to run this plan task by task.
> Steps use checkboxes for tracking.

**Goal:** добавить страницу `/notes/:id/edit` с предзаполненной формой и сохранением через `PATCH`.
**Design:** docs/plans/2026-11-20-edit-note-design.md
**Architecture:** `App.tsx` получает дочерний маршрут внутри `Layout`; `EditNotePage.tsx` загружает заметку по id, показывает локальную форму с теми же правилами валидации, что у `CreateNoteForm`, и отправляет PATCH только редактируемых полей; `NoteCard.tsx` даёт ссылку входа.

**Stack:** React 19 + TypeScript, react-router `8.5.0`, react-hook-form, Tailwind `4.3.3`, json-server `1.0.0-beta.15`, scratch-CDP-харнесс `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`.

## Global Constraints
- Не менять `src/components/CreateNoteForm.tsx` и `src/components/NoteFilterForm.tsx`.
- Не менять `onTagsChange(tags: string[])` и `selectedTags.every(...)`.
- Не трогать дублирующий маршрут `/notes` в `App.tsx`.
- Только Tailwind; без CSS-модулей, inline-стилей и новых зависимостей.
- Не коммитить `db.json`; push не делать без отдельной просьбы.
- Тесты: каждый `--task` запускается отдельным процессом; task 4 требует `--empty`.

## Review Focus
- Невалидный tags-ввод (5 тегов / 20 символов / запрещённые символы) — форма не отправляет запрос.
- Отсутствующая заметка (`GET /notes/<id>` → 404) — показывается `Note not found.`, без запроса PATCH.
- Ошибка PATCH (500) — сообщение `Could not save the note.`, значения полей сохранены.
- `createdAt` и `id` не должны попадать в тело PATCH.
- Кнопка Edit не должна ломать текущую AND-фильтрацию и удаление.

## Sources
- `package.json:15,19` — версии json-server и react-router (прочитано 2026-11-20).
- `node_modules/json-server/lib/app.js:118,127`, `lib/service.js:120-131,142` — `PATCH /:name/:id` и 404 (прочитано 2026-11-20).
- `node_modules/react-router/dist/development/index.d.ts:45,444` — `useParams` (прочитано 2026-11-20).
- `src/utils.ts:3,5-14` — `DB_LINK` и `mapNoteFromDTO` (прочитано 2026-11-20).

## File Map
| File | Action | Responsibility |
|---|---|---|
| `src/components/NoteCard.tsx` | Modify | ссылка Edit на карточке |
| `src/pages/EditNotePage.tsx` | Create | загрузка, форма, PATCH, ошибки |
| `src/App.tsx` | Modify | маршрут `/notes/:id/edit` внутри `Layout` |
| `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` | Modify (вне репозитория) | task 10 и стаб `/notes/:id` + PATCH |

### Task 1: Edit-ссылка на карточке

**Files:**
- Modify: `src/components/NoteCard.tsx:1-8` (импорт `Link`, добавление ссылки рядом с Delete)
- Test: `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`, новый блок `task === "10"` и обновление initial-wait условия в строке ~162

**Covers:** критерий 1.

**Interfaces:**
- Produces: `a[href="/notes/edit-note-1"]` с текстом `Edit` внутри каждого `article`.
- Consumes TASK 2: тот же id берётся из URL.

- [ ] **Step 1: добавить в харнесс task 10 с проверкой ссылки**

В `source` доложить фикстуру:
```js
{ id:"edit-note-1", title:"Editable note", content:"Original body", createdAt:"2026-01-05T00:00:00.000Z", hidden:false, tags:["work","home"] },
```
В initial wait (строка ~162) добавить `|| task === "10"`. Тест:
```js
if (task === "10" || task === "all") {
  await caseRun("task10 edit link", async () => {
    const base = (process.env.TEST_URL || "http://localhost:5176/notes").replace(/\/(notes|create|login)$/, "")
    await send("Page.navigate", { url: `${base}/notes` })
    await waitFor("document.querySelectorAll('article').length", 5, "notes with editing fixture")
    ok("edit link on card", await evaluate(`[...document.querySelectorAll('article a')].some(a => a.textContent.trim() === "Edit" && a.getAttribute("href") === "/notes/edit-note-1")`))
  })
}
```

- [ ] **Step 2: запустить и убедиться в падении**

Run: `$env:TEST_URL='http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=10`
Expected: `FAIL edit link on card`, `task=10: 0 passed, 1 failed`.

- [ ] **Step 3: добавить `Link` в `NoteCard.tsx`**

Импортировать `Link` из `react-router`; рядом с кнопкой Delete (строки 51-57) добавить `<Link to={`/notes/${note.id}/edit`} className="mt-auto self-start rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-[#2563eb] transition-colors duration-200 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Edit</Link>`. Кнопку Delete и её обработчик не трогать.

- [ ] **Step 4: зелёный прогон**

Run: та же команда. Expected: `PASS edit link on card`, `task=10: 1 passed, 0 failed`.

- [ ] **Step 5: коммит**

`git add src/components/NoteCard.tsx && git commit -m "feat: add edit link to note card"` (харнесс вне репозитория).

### Task 2: маршрут и загрузка заметки

**Files:**
- Create: `src/pages/EditNotePage.tsx`
- Modify: `src/App.tsx:31-41` (добавить дочерний маршрут)
- Test: тот же task 10, второе `caseRun`

**Covers:** критерий 2 и часть критерия 5 (404).

**Interfaces:**
- Consumes: `mapNoteFromDTO` из `src/utils.ts`, `Note`/`NoteDTO` из `src/types.ts`, `useParams` из `react-router`.
- Produces: `GET http://localhost:3000/notes/edit-note-1` и предзаполненные поля `#edit-title`, `#edit-content`, `#edit-tags`.

- [ ] **Step 1: дополнить стаб и тест**

В `/users`-независимой части стаба `/notes` добавить:
```js
const single = /^\/notes\/([^/?]+)$/.exec(new URL(url, location.href).pathname);
if (method === "GET" && single) {
  const found = fixture.find(n => n.id === decodeURIComponent(single[1]));
  if (!found) return new Response(JSON.stringify({error:"Not Found"}), {status:404,headers:{"Content-Type":"application/json"}});
  return new Response(JSON.stringify({...found, createdAt: new Date(found.createdAt)}), {status:200,headers:{"Content-Type":"application/json"}});
}
if (method === "PATCH") {
  const body = bodyText ? JSON.parse(bodyText) : {};
  window.__patchUrl = method + " " + url;
  window.__patchBody = body;
  const found = fixture.find(n => n.id === body.id);
  return new Response(JSON.stringify({...found, ...body}), {status:200,headers:{"Content-Type":"application/json"}});
}
```
Тест:
```js
await caseRun("task10 edit page load", async () => {
  const base = (process.env.TEST_URL || "http://localhost:5176/notes").replace(/\/(notes|create|login)$/, "")
  await send("Page.navigate", { url: `${base}/notes/edit-note-1/edit` })
  await waitFor("!!document.querySelector('form')", true, "edit form mounted")
  eq("edit pathname", await evaluate(`location.pathname`), "/notes/edit-note-1/edit")
  eq("edit heading", await evaluate(`document.querySelector('h1')?.textContent.trim()`), "Edit note")
  eq("edit fetch exact", await evaluate(`window.__fetchLog.includes("GET http://localhost:3000/notes/edit-note-1")`), true)
  eq("edit prefilled", await evaluate(`({title:document.querySelector('#edit-title')?.value, content:document.querySelector('#edit-content')?.value, tags:document.querySelector('#edit-tags')?.value, hidden:document.querySelector('#edit-hidden')?.checked})`), {title:"Editable note", content:"Original body", tags:"work, home", hidden:false})
})
await caseRun("task10 edit not found", async () => {
  const base = (process.env.TEST_URL || "http://localhost:5176/notes").replace(/\/(notes|create|login)$/, "")
  await send("Page.navigate", { url: `${base}/notes/missing/edit` })
  await waitFor(`document.body.textContent.includes("Note not found.")`, true, "not found shown")
  eq("not found message", await evaluate(`document.body.textContent.includes("Note not found.")`), true)
})
```

- [ ] **Step 2: красный прогон**

Run: task 10. Expected: `FAIL edit form mounted: timed out`, `FAIL edit pathname`, `FAIL not found message` — страница ещё не существует.

- [ ] **Step 3: реализовать `EditNotePage.tsx` и маршрут**

`EditNotePage`: `useParams()` → `id`; `useEffect` → `GET ${DB_LINK}/notes/${encodeURIComponent(id)}`; при `res.status === 404` установить `Note not found.`; при `!res.ok` — `Could not load note. Is the server running (npm run db)?`; иначе `mapNoteFromDTO` и `reset({title, content, tags: note.tags.join(", "), hidden})`. Разметка и classes скопировать из `src/pages/CreateNotePage.tsx` и `src/components/CreateNoteForm.tsx`; id полей `edit-title`, `edit-content`, `edit-tags`, `edit-hidden`; кнопка `Save note`. В `App.tsx` добавить `{ path: "/notes/:id/edit", element: <EditNotePage /> }` внутрь children `Layout` (после `/create`) и импорт страницы.

- [ ] **Step 4: зелёный прогон**

Run: task 10. Expected: все проверки загрузки и 404 проходят.

- [ ] **Step 5: коммит**

`git add src/pages/EditNotePage.tsx src/App.tsx && git commit -m "feat: add edit note route and form loading"`

### Task 3: PATCH, редирект и ошибки

**Files:**
- Modify: `src/pages/EditNotePage.tsx` (submit handler)
- Test: третий `caseRun` в task 10

**Covers:** критерии 3, 4, 5.

**Interfaces:**
- Consumes: `window.__patchUrl`, `window.__patchBody` из стаба Task 2.
- Produces: `PATCH http://localhost:3000/notes/edit-note-1` с телом `{title, content, hidden, tags}`.

- [ ] **Step 1: добавить тесты отправки**

```js
await caseRun("task10 edit submit", async () => {
  const base = (process.env.TEST_URL || "http://localhost:5176/notes").replace(/\/(notes|create|login)$/, "")
  async function fill(sel, value) {
    return evaluate(`(() => { const el=document.querySelector(${JSON.stringify(sel)}); const proto=el.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,"value").set.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event("input",{bubbles:true})); return true; })()`)
  }
  await send("Page.navigate", { url: `${base}/notes/edit-note-1/edit` })
  await waitFor("!!document.querySelector('#edit-title')", true, "edit ready")
  await fill("#edit-title", "Updated note")
  await fill("#edit-tags", "work, fresh")
  ok("save clicked", await evaluate(`document.querySelector('form button[type="submit"]').click(), true`))
  await waitFor("window.__patchBody !== null", true, "patch recorded")
  eq("patch endpoint exact", await evaluate(`window.__patchUrl`), "PATCH http://localhost:3000/notes/edit-note-1")
  eq("patch body exact", await evaluate(`window.__patchBody`), {title:"Updated note", content:"Original body", hidden:false, tags:["work","fresh"]})
  await waitFor("location.pathname", "/notes", "redirect after edit")
  ok("updated title visible", await evaluate(`[...document.querySelectorAll('article h2')].some(h => h.textContent.trim() === "Updated note")`))
})
```

- [ ] **Step 2: красный прогон**

Run: task 10. Expected: `FAIL patch recorded: timed out`, `FAIL patch endpoint exact`, `FAIL patch body exact`.

- [ ] **Step 3: реализовать submit**

`handleSubmit` формы собирает `Note`-подобный объект только из `{title, content, hidden, tags: parseTags(tags)}`; `fetch(${DB_LINK}/notes/${encodeURIComponent(id)}, {method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)})`; при `!res.ok` бросить ошибку; успех → `navigate("/notes")`; ошибка → `setError("Could not save the note.")`. Правила валидации: те же функции и константы, что в `CreateNoteForm.tsx:5-54` (100/2000/5/20 и regex), с русскими/английскими сообщениями из этого файла. `id` и `createdAt` в тело не включать.

- [ ] **Step 4: зелёный прогон и регресс**

Run: task 10; затем tasks 1–9 по одному; `npm run build`; `npm run lint`. Expected: task 10 без падений, tasks 1–9 зелёные, build/lint exit 0.

- [ ] **Step 5: коммит**

`git add src/pages/EditNotePage.tsx && git commit -m "feat: save edits with PATCH"`

## Handoff
Plan saved. Рекомендую inline execution: 3 задачи, последовательные, контекст помещается. Delegated execution — альтернатива, если нужна проверка между задачами, но free-лимит моделей сейчас исчерпан.
