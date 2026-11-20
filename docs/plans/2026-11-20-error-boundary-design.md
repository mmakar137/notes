# Error boundary design

Date: 2026-11-20. Status: pending user approval.

## Intent
При непредвиденном исключении во время рендера React размонтирует всё дерево, и пользователь видит пустой экран. Нужна отдельная страница ошибки с понятным сообщением, техническими деталями и рабочим выходом, которая ловит сбои рендера всех страниц приложения.

## Goals, non-goals, anti-goals
- Goal: показать fallback-страницу вместо пустого экрана при любом исключении в рендере детей `RouterProvider`.
- Goal: дать пользователю кнопку «Back to home», гарантированно уводящую с проблемного экрана.
- Non-goals: ловить ошибки в event handlers и асинхронных колбэках, отправлять отчёты во внешний сервис, восстанавливать состояние формы.
- Anti-goal: сломать tasks 1–11, дублирующий маршрут `/notes` и существующие сообщения об ошибках.

## Constraints
- Tailwind только; без CSS-модулей, inline-стилей и новых зависимостей (package.json не меняется).
- Не менять `src/components/CreateNoteForm.tsx`, `src/components/NoteFilterForm.tsx`, `onTagsChange(tags: string[])`, `selectedTags.every(...)` и дублирующий маршрут `/notes` в `App.tsx`.
- Не коммитить `db.json`; push только по отдельной просьбе.
- React 19.2.8 и react-router 8.5.0 — из `package.json:16,19`, прочитано 2026-11-20; `StrictMode` включён в `src/main.tsx:6-9`; ESLint 10 с `eslint-plugin-react-hooks` 7.1.1, `tsconfig.app.json` с `erasableSyntaxOnly`.
- react.dev подтверждает: прямого эквивалента `getDerivedStateFromError`/`componentDidCatch` у хуков нет; рекомендуется один общий class ErrorBoundary (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary, открыто 2026-11-20).

## Approach
Выбран вариант A из rationale: один файл `src/pages/ErrorBoundary.tsx` с class-логикой и вёрсткой fallback, обёртка вокруг `RouterProvider` в `App.tsx`. Отклонены: `react-error-boundary` (новая зависимость), `errorElement` react-router (не ловит ошибки провайдеров и противоречит выбранной точке установки), разделение на два файла (лишняя поверхность без выигрыша).

## Design
- Тест task 12 живёт во внешнем scratch-CDP-харнесе `D:\opencode\tmp\opencode\tag-dropdown-test.mjs` (не в репозитории): `$env:TEST_URL = 'http://localhost:5176/notes'; node 'D:\opencode\tmp\opencode\tag-dropdown-test.mjs' --task=12`. Репозиторий не имеет test framework, и dependency добавлять запрещено; харнесс уже используется для tasks 1–11 и перехватывает `console.error` через внедряемый скрипт.
- `ErrorBoundary` — class-компонент, расширяет `Component<Props, State>`; `Props` содержит `children: ReactNode`, `State` — `{ error: unknown }`.
- `static getDerivedStateFromError(error: unknown)` возвращает `{ error }`; `componentDidCatch(error: unknown, info: ErrorInfo)` пишет в консоль `console.error("Uncaught error:", error, info.componentStack)`.
- `render()`: если `this.state.error === null`, возвращает `this.props.children`; иначе — полноэкранную карточку с заголовком `Something went wrong.`, пояснением `An unexpected error occurred. You can return to the home page and try again.` (agent's call: в дизайне не было утверждённого текста), мелким текстом деталей (`error instanceof Error ? error.message : String(error)`) и кнопкой `Back to home`.
- Кнопка делает полный переход `window.location.href = "/"` — boundary стоит вне роутера, поэтому `useNavigate` недоступен; полный переход также сбрасывает любое застревание в ошибочном состоянии.
- Вёрстка повторяет карточки `src/pages/CreateNotePage.tsx:32-42` и `src/pages/EditNotePage.tsx:143-147` (файл существует, проверено 2026-11-20): контейнер `mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14`, белая карточка с серой границей, красный баннер для деталей, синяя кнопка с focus-visible.
- `App.tsx`: `<AuthProvider><ErrorBoundary><RouterProvider router={router} /></ErrorBoundary></AuthProvider>`. AuthProvider остаётся снаружи; дублирующий маршрут `/notes` не трогается.
- Тест task 12 в `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`: фикстура только для `--task=12` с невалидным `createdAt: "not-a-date"` вызывает `RangeError` в `NoteViewPage` при `toISOString()`. Проверяются fallback, детали, `console.error` и переход кнопки на `/`. Тест не добавляет test-only кода в продакшн.

## Specification
### Inputs
| Input | Type | Required | Constraints | Default |
|---|---|---|---|---|
| `children` | `ReactNode` | да | дерево приложения | — |
| Исключение в рендере потомка | `unknown` | нет | любое значение, не только `Error` | — |

### Outputs
| Case | Result | Shape |
|---|---|---|
| Потомки рендерятся без ошибок | обычное приложение | `children` |
| Исключение в рендере потомка | fallback-страница | заголовок, детали, кнопка `Back to home` |
| Клик по кнопке | переход на главную | `location.pathname === "/"` |
| Любое исключение | запись в консоль | `console.error` с error и componentStack |

### Edge cases
| Case | Expected behaviour |
|---|---|
| Выброшено не `Error`, а строка/null | детали показываются через `String(error)`, page не падает второй раз |
| Ошибка в `StrictMode` (dev) | fallback показывается после повторной попытки рендера; дополнительный console.error допустим |
| Ошибка в Layout или любой странице внутри роутера | перехватывается тем же boundary |
| Ошибка в `AuthProvider` | не перехватывается (boundary внутри провайдера) — осознанное ограничение |

### Acceptance criteria
- [ ] При невалидном `createdAt` вместо пустого экрана показывается `Something went wrong.`.
- [ ] На странице виден текст деталей с сообщением об ошибке `Invalid time value`.
- [ ] `console.error` вызван с ошибкой и componentStack.
- [ ] Кнопка `Back to home` переводит на `/`.
- [ ] tasks 1–11 зелёные; `npm run build` и `npm run lint` exit 0.
- [ ] Новая зависимость не добавлена; Tailwind только; запрещённые файлы и дублирующий `/notes` не изменены.

### Out of scope
- Ошибки event handlers/асинхронного кода, error reporting service, восстановление состояния форм, тест для ошибки в `AuthProvider`.

## Decisions
- Пользователь: A (полная страница), «Back to home», сообщение + детали, установка вокруг `RouterProvider`, один файл в `src/pages/ErrorBoundary.tsx` (2026-11-20: пользователь поправил расположение с `src/components/` на `src/pages/`; полноэкранный fallback хранится рядом со страницами).
- Agent's call: детали ошибки показываются на экране, полный stack — только в консоли.
- Agent's call: тестовый сбой моделируется невалидными данными (`createdAt`), а не test-only кодом в приложении.
- Builder-check 2026-11-20: вопрос о запуске task 12 закрыт внешним харнесом и командой выше; утверждение «EditNotePage не существует» неверно — файл `src/pages/EditNotePage.tsx` найден; текст пояснения зафиксирован как agent's call.

## Sources
- `package.json:16,19` — версии React 19.2.8 и react-router 8.5.0, прочитано 2026-11-20.
- `src/main.tsx:6-9` — StrictMode, прочитано 2026-11-20.
- `src/App.tsx:72-78` — текущая точка входа, прочитано 2026-11-20.
- `src/pages/CreateNotePage.tsx:32-42`, `src/pages/EditNotePage.tsx:143-147` — стиль карточек, прочитано 2026-11-20.
- https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary — API Error Boundary, открыто 2026-11-20.
- `docs/plans/2026-11-20-view-note-design.md` — действующие ограничения и проверенное окружение, прочитано 2026-11-20.
