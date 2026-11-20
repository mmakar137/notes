# Note ownership design

Date: 2026-11-20. Status: pending user approval. Amended after builder check: list filtering moved from a json-server query to the client, and the five blocking questions were resolved as controller rulings.

## Intent
Авторизация в приложении есть, но заметки общие: любой вошедший видит, открывает, редактирует и удаляет все записи. Нужно, чтобы пользователь работал только со своими заметками — в списке, по прямым URL просмотра/редактирования и при удалении.

## Goals, non-goals, anti-goals
- Goal: список показывает только заметки текущего пользователя; новые заметки получают его `authorId`.
- Goal: прямая ссылка на чужую заметку (просмотр или редактирование) показывает явное сообщение о доступе, а не данные заметки.
- Goal: попытка удалить чужую заметку не отправляет `DELETE` и показывает то же сообщение.
- Non-goals: серверная авторизация в json-server (реальный контроль доступа), смена владельца, общие/публичные заметки, новые зависимости.
- Anti-goal: сломать tasks 1–15, дублирующий маршрут `/notes`, ErrorBoundary, 404-страницу или запрещённые файлы.

## Constraints
- Ответы в русском; UI-тексты новых сообщений английские.
- Tailwind только; без CSS-модулей, inline-стилей и новых зависимостей (`package.json` не меняется).
- Не менять `src/components/CreateNoteForm.tsx`, `src/components/NoteFilterForm.tsx`, `onTagsChange(tags: string[])`, `selectedTags.every(...)` и дублирующий маршрут `/notes` в `src/App.tsx`.
- Не коммитить `db.json`; push только по отдельной просьбе.
- Тесты остаются во внешнем CDP-харнесе `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`; тестового кода в production нет.
- Контроль только на клиенте: прямой `fetch`/`curl` к json-server обходит проверку владельца. Это ограничение фиксируется явно, а не маскируется.

## Approach
Пользователь выбрал A в rationale: полный клиентский контроль всех операций плюс исправление логина и фикстур. Пользователь выбрал B для чужой заметки: явное сообщение доступа вместо «Note not found.» или тихого редиректа. Отклонены: серверная проверка (меняет dev-окружение), только скрытие чужих URL, сокрытие факта существования заметки.

Источник данных уже есть: `db.json` содержит `authorId` у всех заметок, а `useAuthContext()` отдаёт текущего пользователя. Новый бэкенд не нужен.

**Ruling после builder check:** фильтрация списка делается на клиенте, а не через `GET /notes?authorId=`. Причина проверена на живом сервере: `GET /users?id=1` возвращает `[]`, хотя в `db.json` лежит `"id": "1"`; `json-server@1.0.0-beta.15` приводит числовой query к `number` (`node_modules/json-server/lib/parse-where.js:32-44`) и сравнивает строго (`matches-where.js:47`). Переназначать сид-заметки на нечисловой id нельзя — пользователь явно выбрал `"1"`. Клиентская фильтрация к тому же точнее соответствует выбранному пользователем «контролю только на клиенте».

## Design
### Модель и маппинг
- `src/types.ts`: добавить `authorId?: string` в `Note` и `NoteDTO`. Поле **опциональное**: `CreateNoteForm.tsx:86-93` (файл запрещено менять) конструирует `Note` без `authorId`; обязательное поле сломало бы `tsc`.
- `src/utils.ts`: экспортировать `OWN_NOTES_ONLY_MESSAGE = "You can only work with your own notes."` и копировать `authorId` в `mapNoteFromDTO`.

### Список (`src/pages/notesPage.tsx`)
- `refetchNotes` запрашивает `GET /notes` как сейчас (сортировка `-createdAt` и фильтры `NoteFilterForm` сохраняются) и после `mapNoteFromDTO` оставляет только записи с `note.authorId === user.id`.
- Если `user` отсутствует (возможно на дублирующем `/notes` вне `Layout`), запрос не выполняется, а существующий `<Navigate to="/login" />` продолжает работать. В `useEffect` добавить `user?.id` в зависимости; комментарий `eslint-disable` оставить как есть.
- Фильтрация по тегам (`selectedTags.every(...)`) и `onTagsChange` не трогаются.
- `handleDelete(id)`: найти заметку в `notes` по `id`; если `note.authorId !== user.id`, установить `OWN_NOTES_ONLY_MESSAGE` и вернуться без `fetch`. Для своей заметки `DELETE` и обновление списка работают как сейчас.
- Сообщение выводится в уже существующем красном `<p>` для `error` — нового стиля не нужно.

### Создание (`src/pages/CreateNotePage.tsx`)
- Подключить `useAuthContext()`. В `handleSubmit` отправлять `body: JSON.stringify({ ...note, authorId: user.id })` — `CreateNoteForm` остаётся неизменным, владелец добавляется на уровне страницы.
- Если `user` отсутствует, не отправлять POST, показать `OWN_NOTES_ONLY_MESSAGE` и вернуть `false`.

### Просмотр (`src/pages/NoteViewPage.tsx`)
- Подключить `useAuthContext()`. После успешного `GET /notes/:id` сравнить `loaded.authorId` с `user?.id`. При несовпадении или отсутствии пользователя установить `error = OWN_NOTES_ONLY_MESSAGE`, `note` не установить — заголовок остаётся «View note», тело заметки и кнопки не показываются.
- Сообщения «Note not found.» и «Could not load note...» сохраняются для несуществующих заметок и ошибок сервера.

### Редактирование (`src/pages/EditNotePage.tsx`)
- Подключить `useAuthContext()`. После загрузки заметки сравнить `authorId` с `user?.id`. При несовпадении или отсутствии пользователя установить `error = OWN_NOTES_ONLY_MESSAGE`, не вызывать `reset()` и не ставить `loaded = true` — форма не рендерится, `PATCH` не отправляется.
- Для своей заметки поведение формы и все сообщения об ошибках остаются прежними.

### Логин (`src/pages/LoginPage.tsx`)
- Сейчас `setUser(users)` кладёт в контекст и `localStorage.user` **массив**, поэтому `user.id` равен `undefined`. Заменить на выбор одного пользователя: `const matched = users.find((u) => u.password === data.password && typeof u.id === "string" && u.id)`; затем `setUser({ id: matched.id, email: String(matched.email), password: String(matched.password) })`. При нескольких совпадениях берётся первый.
- Существующие русские сообщения об ошибках логина не трогаются (вне scopes владельца).

### Локальные данные и харнес
- `db.json`: в рабочей копии заменить `authorId: "1x"` на `"1"` у всех 7 заметок, чтобы при разработке был виден начальный набор. Файл **не коммитится**.
- Фикстуры харнеса: добавить `authorId: "1"` ко всем базовым заметкам и к task-specific (`edit-note-1`, `view-note-1`, `crash-note-1`), чтобы задачи 1–15 остались зелёными.
- Для задач 16–20 добавить в фикстуру одну заметку с `authorId: "2"` (владелец — другой пользователь из `usersFixture`, под текущим пользователем `"1"` не логинимся).
- Shim: добавить `DELETE`-ветку (логирование и удаление из фикстуры), чтобы можно было проверить отсутствие/наличие запроса. Query `authorId` в shim не нужен: фильтрация клиентская.
- Обновить утверждение task 9: было «login stores an array» (`Array.isArray(...) === true`), стало проверка, что `localStorage.user` — объект `{ id: "3", email: "numeric@example.com", password: "1111" }`. Старое утверждение фиксировало баг.
- Mapping задач 16–20 (все во внешнем харнесе):
  - 16 — список: в фикстуре 4 своих + 1 чужая; рендерятся только 4 своих, чужого заголовка и кнопки `Delete` нет.
  - 17 — создание: после submit `__postBody.authorId === "1"`.
  - 18 — просмотр чужой: `/notes/foreign-note-1` показывает текст доступа, тела и кнопки `Edit` нет.
  - 19 — редактирование чужой: `/notes/foreign-note-1/edit` показывает текст доступа, формы нет, `PATCH` в логе нет.
  - 20 — удаление: клик `Delete` на своей заметке отправляет `DELETE` и убирает карточку; чужая карточка не рендерится, поэтому удалить её из UI невозможно. Явный клик по чужой кнопке недостижим при корректной фильтрации — guard в `handleDelete` остаётся защитным и проверяется код-ревью.

## Specification
### Inputs
| Input | Type | Required | Constraints | Default |
|---|---|---|---|---|
| `user.id` из `localStorage.user` | string | да для операций с заметками | берётся из `AuthContext` | `null` → редирект на `/login` в списке, текст доступа в view/edit |
| `authorId` заметки | string \| undefined | нет | отсутствует у заметок без владельца | считается чужой |
| `GET /notes` | HTTP | да для списка | ответ фильтруется в браузере | — |

### Outputs
| Case | Result | Shape |
|---|---|---|
| Своя заметка в списке | карточка как сейчас | `NoteCard` с View/Edit/Delete |
| Чужая заметка в списке | не рендерится | карточки нет |
| Создание | POST с владельцем | `__postBody.authorId === user.id` |
| Чужой `/notes/:id` | сообщение доступа | `You can only work with your own notes.` вместо тела |
| Чужой `/notes/:id/edit` | сообщение доступа | форма не рендерится, PATCH нет |
| Попытка удалить чужую | сообщение доступа | DELETE нет, карточка остаётся |

### Edge cases
| Case | Expected behaviour |
|---|---|
| Гость на дублирующем `/notes` | без запроса к `/notes`, редирект на `/login` |
| `user === null` в view/edit | текст доступа, данные не показываются |
| Заметка без `authorId` | считается чужой для всех пользователей |
| Два пользователя с одинаковым email/паролем | логин берёт первого найденного |
| Пароль пользователя — число в JSON | приводится к строке через `String()` |
| Ошибка сети при загрузке | прежние сообщения «Could not load note...» / «Could not load notes...» |

### Acceptance criteria
- [ ] Список показывает только заметки с `authorId === user.id` (проверено задачей 16).
- [ ] Новая заметка сохраняется с `authorId` вошедшего пользователя (задача 17).
- [ ] Просмотр и редактирование чужой заметки показывают «You can only work with your own notes.» (задачи 18–19).
- [ ] Guard удаления не допускает DELETE для чужой заметки (код-ревью; чужая карточка не рендерится).
- [ ] После реального логина `localStorage.user` — один объект с корректным `id` (задача 9).
- [ ] Tasks 1–15 зелёные; tasks 16–20 зелёные; `npm run build` и `npm run lint` exit 0.
- [ ] `db.json` не закоммичен; запрещённые файлы и дублирующий `/notes` не изменены.

### Out of scope
- Серверная авторизация json-server, смена владельца, публичные заметки, тесты внутри репозитория, отдельный black-box тест клика по несуществующей чужой кнопке Delete.

## Decisions
- Пользователь (Q1): A — все операции: список, создание, просмотр, редактирование, удаление, исправление логина и фикстур.
- Пользователь (Q2): B — явное сообщение о доступе.
- Пользователь (Q3): B — локально переназначить сид-заметки на пользователя `"1"`, без коммита `db.json`.
- Пользователь (Q4): A — текст «You can only work with your own notes.» единый для просмотра, редактирования и удаления.
- Пользователь (Q5): A — при удалении чужой не отправлять DELETE и показывать тот же текст.
- Пользователь (Q6): A — обновить фикстуры и добавить задачи 16–20 во внешнем харнесе.
- Agent's call (исходный, отменён после builder check): фильтрация через `?authorId`.
- Controller ruling (после builder check): фильтрация клиентская, потому что json-server 1.0.0-beta.15 приводил бы числовой `"1"` к `number` и не нашёл бы строковый `authorId`.
- Controller ruling: `user === null` в view/edit → тот же текст доступа, без редиректа.
- Controller ruling: задачи 16–20 смаплены явно (список/создание/просмотр/редактирование/удаление), чужой владелец в харнесе — `"2"`.
- Controller ruling: логин кладёт `{ id, email: String(email), password: String(password) }`, первый найденный пользователь.
- Controller ruling: обновление утверждения task 9 (оно фиксировало баг логина).

## Sources
- `docs/plans/2026-11-20-note-ownership-design.md` — исходная версия, исправлена после builder check.
- `src/types.ts`, `src/utils.ts`, `src/components/CreateNoteForm.tsx:85-99` — типы, маппинг и запрещённый конструктор `Note`.
- `src/pages/notesPage.tsx`, `src/pages/CreateNotePage.tsx`, `src/pages/NoteViewPage.tsx`, `src/pages/EditNotePage.tsx`, `src/pages/LoginPage.tsx:32-41` — точки вставки проверки владельца.
- `src/App.tsx:58-89`, `src/pages/Layout.tsx:7-9` — дублирующий `/notes` и auth-guard.
- `db.json` — пользователи и 7 заметок с `authorId: "1x"`.
- `D:\opencode\tmp\opencode\tag-dropdown-test.mjs:94-192,541-584,691-762` — фикстуры, shim и задачи 9/12–15.
- `node_modules/json-server/lib/parse-where.js:32-44`, `node_modules/json-server/lib/matches-where.js:47` — приведение query и строгое сравнение.
- Live probe 2026-11-20: `GET /users?id=1` → `[]`, `GET /users?email=admin@email.com` → один пользователь.
- `.godmode/runs/2026-11-20-note-ownership-plan/builder-check.md` — findings, на которые есть rulings выше.
