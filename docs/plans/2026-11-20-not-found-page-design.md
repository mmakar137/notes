# Not found page design

Date: 2026-11-20. Status: pending user approval.

## Intent
Неизвестный URL сейчас не показывает ничего понятного: маршрут `*` не объявлен, поэтому react-router создаёт внутренний 404 и передаёт его ближайшему error boundary — пользователь видит дефолтное «Unexpected Application Error!». Нужна страница 404 с пояснением и рабочим выходом на главную, доступная независимо от авторизации.

## Goals, non-goals, anti-goals
- Goal: любой несовпавший путь показывает полноэкранную страницу «Page not found.» со ссылкой на главную.
- Goal: страница не требует авторизации и не перенаправляет на `/login`.
- Non-goals: кастомные 404 для конкретных разделов, логирование посещений, поиск по сайту, серверные коды ответа (это SPA).
- Anti-goal: сломать tasks 1–12, дублирующий маршрут `/notes` или общую границу ошибок.

## Constraints
- Tailwind только; без CSS-модулей, inline-стилей и новых зависимостей (`package.json` не меняется).
- Не менять `src/components/CreateNoteForm.tsx`, `src/components/NoteFilterForm.tsx`, `onTagsChange(tags: string[])`, `selectedTags.every(...)` и дублирующий маршрут `/notes` в `App.tsx`.
- Не коммитить `db.json`; push только по отдельной просьбе.
- UI-тексты английские, как в существующих страницах (`Note not found.`, `Something went wrong.`).
- React 19.2.8 и react-router 8.5.0 из `package.json:16,19`, прочитано 2026-11-20.

## Approach
Пользователь выбрал A rationale: отдельная страница `src/pages/NotFoundPage.tsx` и catch-all маршрут `*` последним в массиве роутов. Отклонены: переиспользование `ErrorBoundary` (404 — не сбой рендера, детали ошибки были бы вводящими), размещение внутри `Layout` (auth-guard уводил бы гостя на `/login`), копирование шапки `Layout` без guard (дублирование разметки).

## Design
- `NotFoundPage` — function component с default export, без состояния и запросов.
- Размещение: `{ path: "*", element: <NotFoundPage /> }` последним top-level элементом массива в `createBrowserRouter`, после pathless-родителя `<ErrorBoundary><Outlet /></ErrorBoundary>` и вне `Layout`. Так catch-all не затеняет дублирующий `/notes` (статические сегменты приоритетнее splat), страница остаётся доступной без авторизации, а общая граница ошибок всё ещё установлена вокруг `RouterProvider` в `App.tsx`.
- Вёрстка повторяет `src/pages/ErrorBoundary.tsx:29-35`: контейнер `mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14`, `h1` «Page not found.», карточка `flex w-full max-w-[560px] flex-col items-center gap-6 rounded-[14px] border border-[#e2e8f0] bg-white p-7 shadow-sm`.
- В карточке `<div id="not-found">`: пояснение «The page you are looking for does not exist.» и `<Link to="/">Back to home</Link>` со стилем синей кнопки из `src/App.tsx:31`. Клиентская навигация, без полной перезагрузки.
- Тест task 13 во внешнем CDP-харнесе `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`: переход на несуществующий путь, проверка заголовка, пояснения, `href="/"`, затем реальный клик и проверка «Home Page». Дополнительно проверяется отсутствие `#error-fallback`. Харнесс вне репозитория; новые зависимости не добавляются.

## Specification
### Inputs
| Input | Type | Required | Constraints | Default |
|---|---|---|---|---|
| Несовпавший `location.pathname` | string | да | любой путь, не описанный в роутах | — |

### Outputs
| Case | Result | Shape |
|---|---|---|
| Неизвестный путь | страница 404 | `h1` + пояснение + ссылка `Back to home` |
| Клик по ссылке | переход на главную | `location.pathname === "/"` и заголовок `Home Page` |
| Известный путь | обычная страница | без изменений |

### Edge cases
| Case | Expected behaviour |
|---|---|
| Неизвестный вложенный путь (`/notes/unknown/extra`) | та же страница 404 |
| Путь с query/hash | 404 по `pathname`, без запросов к API |
| Пользователь не авторизован | 404 без редиректа на `/login` |
| Пользователь авторизован | 404 без шапки `Layout` |

### Acceptance criteria
- [ ] При переходе на несуществующий путь `h1` равен «Page not found.».
- [ ] Видно пояснение «The page you are looking for does not exist.».
- [ ] Есть ссылка `Back to home` с `href="/"`.
- [ ] Клик по ссылке уводит на `/` и показывает «Home Page».
- [ ] `#error-fallback` и текст «Unexpected Application Error!» отсутствуют (404 не может быть сбоем рендера).
- [ ] tasks 1–12 зелёные; `npm run build` и `npm run lint` exit 0.
- [ ] Новая зависимость не добавлена; запрещённые файлы и дублирующий `/notes` не изменены.

### Out of scope
- Разные 404 для разделов, серверный статус 404, логирование, поиск, тест для `AuthProvider`.

## Decisions
- Пользователь: A (отдельная страница), размещение вне `Layout`, содержимое «заголовок + пояснение + Back to home», дизайн принят без правок.
- Пользователь после reference-check: маршрут `*` — последним top-level сиблингом, а не внутри pathless-родителя.
- Agent's call: текст пояснения, `id="not-found"` как тестовый якорь, `<Link>` вместо `<button>`.

## Sources
- `src/pages/ErrorBoundary.tsx:29-35` — карточка и контейнер, прочитано 2026-11-20.
- `src/App.tsx:13-39,72-92` — главная страница, стиль кнопки и текущая точка входа, прочитано 2026-11-20.
- `src/pages/Layout.tsx:7-9` — auth-guard, прочитано 2026-11-20.
- `package.json:16,19` — версии React и react-router, прочитано 2026-11-20.
- `docs/plans/2026-11-20-error-boundary-design.md` — действующие ограничения, прочитано 2026-11-20.
- `node_modules/react-router/dist/development/lib/router/utils.d.ts:741-748` — `path` может заканчиваться на `/*`; `path: "*"` как catch-all, прочитано 2026-11-20.
- `node_modules/react-router/dist/development/lib/router/router.js:1318-1327` — внутренний 404 при отсутствии совпадения, прочитано 2026-11-20.
- `node_modules/react-router/dist/development/lib/hooks.js:723-773` — default error element при 404, прочитано 2026-11-20.
