# Edit note page design

Date: 2026-11-20. Status: approved by the user on 2026-11-20.

## Intent
Пользователь может создавать и удалять заметки, но не может их изменить. Нужна страница редактирования с теми же полями и правилами валидации, что и у создания.

## Goals, non-goals, anti-goals
- Goal: изменить title/content/tags/hidden существующей заметки и вернуться к списку.
- Non-goals: изменение `id` или `createdAt`, массовое редактирование, undo/history, диалог подтверждения.
- Anti-goal: сломать `CreateNoteForm.tsx`, `NoteFilterForm.tsx`, фильтрацию по тегам и текущие маршруты.

## Constraints
- Tailwind только; без CSS-модулей, inline-стилей и новых зависимостей.
- `src/components/CreateNoteForm.tsx` и `src/components/NoteFilterForm.tsx` не изменяются.
- json-server `1.0.0-beta.15` (`package.json:15`); `PATCH /notes/:id` описан в `node_modules/json-server/lib/app.js:118`, слияние полей — в `lib/service.js:127`; 404 при отсутствии записи — `lib/app.js:127`.
- react-router `8.5.0` (`package.json:19`), `useParams` экспортируется (`node_modules/react-router/dist/development/index.d.ts:45`).
- `NoteDTO.createdAt` — строка, `mapNoteFromDTO` из `src/utils.ts` переводит её в `Date`.

## Approach
Выбран вариант A: полная страница `/notes/:id/edit` с отдельной формой и кнопкой Edit на карточке. Отклонены: переход по URL без кнопки (недоступно пользователю), переиспользование `CreateNoteForm` (запрещено менять файл), админка json-server (не интегрирована). Сохранение — PATCH (решение пользователя): отправляются только редактируемые поля.

## Design
- `App.tsx`: дочерний маршрут `/notes/:id/edit` внутри `Layout`, поэтому страница доступна только авторизованным.
- `src/pages/EditNotePage.tsx`: загружает `GET /notes/:id`, показывает форму с начальными значениями, отправляет `PATCH /notes/:id` и редиректит на `/notes`.
- Форма — отдельная, внутри страницы: Title / Content / Tags (через запятую) / Hidden, кнопка Save note. Правила валидации скопированы из `CreateNoteForm.tsx` (максимумы 100/2000/5 тегов/20 символов, только буквы, цифры и дефис).
- `NoteCard.tsx`: ссылка Edit рядом с Delete, `to={`/notes/${note.id}/edit`}`.
- Ошибки: `Note not found.` при 404 загрузки, `Could not save the note.` при ошибке PATCH, `Could not load note. Is the server running (npm run db)?` при сетевой ошибке загрузки.
- Тесты: новый `--task=10` в scratch-харнесе `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` (вне репозитория).

## Specification
### Inputs
| Input | Type | Required | Constraints |
|---|---|---|---|
| `id` из URL | string | да | без кодирования в тесте; `encodeURIComponent` в запросе |
| title | string | да | 1..100 после trim |
| content | string | нет | ≤2000 |
| tags | string → string[] | нет | ≤5, ≤20 символов, `/^[a-zA-Z0-9а-яА-ЯёЁ-]+$/`, уникальны без учёта регистра |
| hidden | boolean | да | default false |

### Outputs
| Case | Result |
|---|---|
| Успешное сохранение | `PATCH /notes/:id`, редирект на `/notes`, обновлённая карточка |
| Невалидная форма | ошибки под полями, без запроса |
| 404 при загрузке | `Note not found.`, форма не отправляется |
| Ошибка PATCH | `Could not save the note.`, остаёмся на странице редактирования |

### Acceptance criteria
- [ ] Edit-ссылка на карточке ведёт на `/notes/<id>/edit`.
- [ ] Форма открывается с текущими значениями заметки.
- [ ] Отправляется ровно `PATCH http://localhost:3000/notes/<id>` с телом `{title, content, hidden, tags}` без `id` и `createdAt`.
- [ ] После успеха редирект на `/notes` и виден изменённый заголовок.
- [ ] Неверный ввод и ошибки сервера показывают сообщения и не теряют значения полей.
- [ ] Tasks 1–9, build и lint остаются зелёными.

### Out of scope
- Изменение `id`/`createdAt`, удаление, дублирование заметки, подтверждение при уходе с формы.

## Decisions
- Пользователь: A (полная страница), PATCH, сохранить `id`/`createdAt`.
- Agent's call: тексты сообщений об ошибках на английском — по образцу `CreateNotePage.tsx`.
- Agent's call: дублирование правил валидации и `fieldClass` в новой странице, чтобы не трогать `CreateNoteForm.tsx`.

## Sources
- `package.json:15,19` — версии json-server и react-router, прочитано 2026-11-20.
- `node_modules/json-server/lib/app.js:118,127`, `lib/service.js:120-131,142` — PATCH и 404, прочитано 2026-11-20.
- `node_modules/react-router/dist/development/index.d.ts:45,444` — `useParams`, прочитано 2026-11-20.
