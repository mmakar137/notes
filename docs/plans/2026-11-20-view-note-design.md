# View note page design

Date: 2026-11-20. Status: pending user approval.

## Intent
Пользователь видит полный текст заметки только в компактной карточке списка. Нужна отдельная страница чтения с тем же содержимым, где переносы строк в теле заметки отображаются именно так, как введены.

## Goals, non-goals, anti-goals
- Goal: открыть заметку по клику на заголовок или кнопку View и прочитать её тело с сохранёнными переводами строк.
- Non-goals: редактирование, удаление, комментарии, версионирование, экспорт.
- Anti-goal: сломать фильтрацию списка, маршрут `/notes/:id/edit` и существующие задачи 1–10.

## Constraints
- Tailwind только; без CSS-модулей, inline-стилей и новых зависимостей.
- Не менять `src/components/CreateNoteForm.tsx`, `src/components/NoteFilterForm.tsx`, `onTagsChange(tags: string[])`, `selectedTags.every(...)` и дублирующий маршрут `/notes` в `App.tsx`.
- Не коммитить `db.json` (пользовательские изменения уже закоммичены им самим в `443e344`); push только по отдельной просьбе.
- react-router `8.5.0`, json-server `1.0.0-beta.15`, `DB_LINK` и `mapNoteFromDTO` из `src/utils.ts` — проверено в дизайне редактирования 2026-11-20.

## Approach
Выбран вариант A: отдельная страница `/notes/:id` внутри `Layout`. Отклонены: переиспользование `NoteCard` (в нём есть Delete и компактная вёрстка), модалка (нет отдельного адреса). Вход: пользователь выбрал и клик по заголовку, и кнопку View.

## Design
- `App.tsx`: дочерний маршрут `{ path: "/notes/:id", element: <NoteViewPage /> }` внутри `Layout`, рядом с `/notes/:id/edit`.
- `src/pages/NoteViewPage.tsx`: по `useParams()` загружает `GET ${DB_LINK}/notes/${encodeURIComponent(id)}`, переводит DTO через `mapNoteFromDTO`, показывает заголовок, дату, бейджи Hidden/Visible, теги и тело.
- Тело рендерится как `<p className="whitespace-pre-wrap break-words ...">{note.content}</p>` — тот же приём, что уже используется в `NoteCard.tsx:48`; он сохраняет `\n` и переносы по ширине.
- Ошибки: `Note not found.` при 404; `Could not load note. Is the server running (npm run db)?` при сетевой/серверной ошибке — как в `EditNotePage.tsx`.
- `NoteCard.tsx`: заголовок становится `<Link to={`/notes/${note.id}`}>`; в строке действий добавляется ссылка View перед Edit. Delete и его обработчик не меняются.
- Тесты: task 11 в `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` с фикстурой `view-note-1`, содержание которой содержит `\n` и пустую строку.

## Specification
### Inputs
| Input | Type | Required | Constraints |
|---|---|---|---|
| `id` из URL | string | да | кодируется через `encodeURIComponent` |
| GET `/notes/:id` | NoteDTO | да | `createdAt` — строка, переводится в `Date` |

### Outputs
| Case | Result |
|---|---|
| Заметка найдена | заголовок, дата, теги, тело с сохранёнными переводами строк, ссылка Edit |
| 404 | `Note not found.`, без запроса PATCH |
| Ошибка загрузки | `Could not load note. Is the server running (npm run db)?` |

### Edge cases
| Case | Expected behaviour |
|---|---|
| `content` с `\n` и пустыми строками | отображается как несколько строк; `getComputedStyle(p).whiteSpace === "pre-wrap"` |
| Пустой `content` | `<p>` присутствует, но пустой |
| Нет тегов | блок тегов пустой, страница не ломается |

### Acceptance criteria
- [ ] Клик по заголовку карточки ведёт на `/notes/<id>`.
- [ ] Кнопка View в карточке ведёт на `/notes/<id>`.
- [ ] Страница запрашивает ровно `GET http://localhost:3000/notes/<id>`.
- [ ] Тело с `Line one\nLine two\n\nLine four` отображается как 3+ визуальные строки с `white-space: pre-wrap`.
- [ ] На странице есть ссылка Edit на `/notes/<id>/edit`.
- [ ] 404 показывает `Note not found.`; tasks 1–10, build и lint остаются зелёными.

### Out of scope
- Редактирование, удаление, подтверждения при уходе, печатная версия.

## Decisions
- Пользователь: A (полная страница), клик по заголовку и отдельная кнопка View.
- Agent's call: те же строки ошибок, что в `EditNotePage.tsx`, для единообразия.
- Agent's call: фикстура task 11 добавляется только для `--task=11`, чтобы не ломать ожидание 4 карточек в tasks 1–9.

## Sources
- `src/pages/EditNotePage.tsx:81-110` — загрузка по id и обработка 404/ошибок, прочитано 2026-11-20.
- `src/components/NoteCard.tsx:18-20,48,52-58` — заголовок, `whitespace-pre-wrap` и строка действий, прочитано 2026-11-20.
- `src/pages/Layout.tsx:13-39` — общая шапка и auth-guard, прочитано 2026-11-20.
- `docs/plans/2026-11-20-edit-note-design.md` — проверенные версии и API, прочитано 2026-11-20.
