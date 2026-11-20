# Клиентское состояние нотификаций (toast) — дизайн

Дата: 2026-11-21. Статус: **ожидает одобрения пользователя**.

## Цель

Четвёртый Zustand-стор для client state уведомлений: `useToastStore`, компонент `Toaster` и вызовы при успешных действиях пользователя. Продолжение задания «Zustand & client state» по образцу сторов `authState.ts`, `favoritesState.ts`, `themeState.ts`. Пользователь явно уточнил: уведомления для CRUD заметок и для избранного **должны** идти через это клиентское состояние, а не через локальный `useState`.

## Не делаем

- Не подключаем библиотеки (Sonner / react-hot-toast), чтобы не добавлять зависимость и не подменять задачу на стор.
- Не сохраняем тосты в `localStorage` — это сиюминутное UI-состояние.
- Не заменяем существующие инлайновые ошибки форм (`serverError`, `error`) тостами: тосты подтверждают только успех.
- Не делаем тосты для загрузки/фильтрации заметок, 404 и сетевых ошибок.
- Не добавляем тесты в репозиторий — проверки только во внешнем CDP-харнесе.
- Не меняем тексты остального интерфейса: новые сообщения — на английском, как и весь UI.

## Решение 1. Стор

Новый файл `src/store/toastState.ts` по образцу соседних сторов: `create<ToastState>()(...)`, именованный экспорт `useToastStore`, интерфейс состояния без `export` (как у соседей), узкие селекторы у потребителей.

```ts
interface Toast {
  id: string
  message: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string) => void
  dismissToast: (id: string) => void
}
```

- `persist` **не используется**.
- `addToast` создаёт запись через `crypto.randomUUID()` (уже используется в `CreateNoteForm.tsx`), добавляет в конец массива и обрезает по `MAX_TOASTS = 3` через `.slice(-MAX_TOASTS)` — старые тосты вытесняются новыми.
- `dismissToast(id)` удаляет запись по id через `filter`.
- Таймеры живут не в сторе, а в компоненте `ToastItem`: `useEffect` ставит `setTimeout(3000)` и возвращает `clearTimeout`. Это безопасно при `StrictMode` (первый эффект отменяется) и не оставляет скрытых сайд-эффектов в сторе.
- Вызовы `addToast` происходят только в event handler-ах/успешных `then`-ветках, поэтому повторный рендер `StrictMode` не дублирует уведомления.

## Решение 2. Компонент `Toaster`

Новый файл `src/components/Toaster.tsx`, default export по образцу `NoteCard.tsx` / `CreateNoteForm.tsx`.

- Монтируется один раз в `src/App.tsx` внутри внешнего `ErrorBoundary`, рядом с `RouterProvider` — так тосты видны на `/`, `/login`, `/register` и всех защищённых роутах, и переживают навигацию (стор глобальный).
- Структура: `<div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-80">`; каждый тост — `<div data-toast data-toast-id={id} className="pointer-events-auto ...">`.
- Кнопка закрытия: нативный `<button type="button" aria-label="Dismiss notification">`, цель ≥24×24 px, видимый `focus-visible` outline. Фокус не перехватывается, тост не крадёт фокус у формы.
- Доступность: контейнер — live region, цвет не единственный сигнал (есть текст и кнопка), `motion-reduce:transition-none` при наличии анимации.
- Стилизация только Tailwind + токены из `main.css`: `bg-[var(--color-surface)]`, `text-[var(--color-text)]`, `border-[var(--color-border)]`, акцентная полоса `border-l-emerald-500`. Без inline `style` и CSS-модулей.

## Решение 3. Точки вызова и тексты

| Файл | Событие | Текст тоста |
|---|---|---|
| `src/pages/CreateNotePage.tsx` | успешный POST `/notes` | `Note "${title}" created` |
| `src/pages/EditNotePage.tsx` | успешный PATCH `/notes/:id` | `Note "${title}" updated` |
| `src/pages/notesPage.tsx` | успешный DELETE | `Note "${title}" deleted` |
| `src/components/NoteCard.tsx` | клик по звезде | `Added "${title}" to favorites` / `Removed "${title}" from favorites` |
| `src/pages/LoginPage.tsx` | успешный вход | `Signed in` |
| `src/pages/RegisterPage.tsx` | успешная регистрация | `Account created` |
| `src/pages/Layout.tsx` | logout | `Signed out` |
| `src/pages/Layout.tsx` | toggleTheme | `Dark mode enabled` / `Light mode enabled` |

- Для CRUD берём `title` из уже имеющегося объекта `Note` / формы — новый запрос не делаем.
- Для избранного направление берём из текущего `isFavorite`: если было `false`, значит добавили.
- Для темы сообщение вычисляется из текущего `isDark` **до** вызова `toggleTheme()`.
- Все вызовы идут перед `navigate(...)`, чтобы тост успел попасть в стор до размонтирования страницы.
- Для logout тост добавляется до перехода на `/login` и остаётся видимым, потому что `Toaster` живёт в `App`.

## Решение 4. Проверка

Внешний харнес `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`, новые задачи 31–36:

1. `Toaster` смонтирован на `/login` и `/notes`, изначально `data-toast` элементов нет.
2. CRUD: создать/отредактировать/удалить заметку и сверить точный текст тоста.
3. Избранное: два клика по звезде и сверить оба сообщения.
4. Auth/тема: вход, logout, регистрация, переключение темы — сверить тексты.
5. Поведение: автоскрытие ~3 с, максимум 3 тоста, ручное закрытие кнопкой и с клавиатуры.
6. Тёмная тема: computed-стили тоста и отсутствие ошибок в консоли.

`npm run lint` и `npm run build` — обязательные качественные гейты. Коммит, подпись и пуш выполняет пользователь; `docs/plans/` и `.godmode/` в коммит не попадают.

## Specification

### Inputs

| Input | Type | Required | Constraints | Default |
|---|---|---|---|---|
| `message` | `string` | да | непустой, формируется вызывающей стороной | — |
| `id` | `string` | да (внутри стора) | `crypto.randomUUID()` | — |

### Outputs

| Case | Result | Shape |
|---|---|---|
| `addToast(message)` | тост добавлен в конец стека | `{ id, message }` |
| стек > 3 | самый старый удалён | массив длиной 3 |
| `dismissToast(id)` | тост удалён | массив без записи |
| пустой стек | `Toaster` рендерит пустую live region | 0 элементов `[data-toast]` |

### Edge cases

| Case | Expected behaviour |
|---|---|
| несколько быстрых кликов | создаются отдельные тосты, старые вытесняются после третьего |
| навигация сразу после действия | тост остаётся, пока не сработает таймер |
| `StrictMode` двойной mount | таймер первого эффекта очищается, тост не исчезает раньше времени |
| закрытие с клавиатуры | Tab до кнопки, Enter/Space вызывает `dismissToast` |
| тёмная тема | тост использует токены и остаётся читаемым |

### Acceptance criteria

- [ ] Стор `useToastStore` экспортируется из `src/store/toastState.ts`, не использует `persist`.
- [ ] `Toaster` смонтирован один раз в `App.tsx` и виден на публичных и защищённых роутах.
- [ ] CRUD заметок показывает точные тексты `Note "…" created/updated/deleted`.
- [ ] Избранное показывает `Added "…" to favorites` и `Removed "…" from favorites`.
- [ ] Auth/тема показывают `Signed in`, `Account created`, `Signed out`, `Dark/Light mode enabled`.
- [ ] Одновременно видно не более 3 тостов; автоскрытие через 3000 мс.
- [ ] Кнопка закрытия имеет `aria-label="Dismiss notification"` и работает с клавиатуры.
- [ ] Контейнер имеет `role="status"` / `aria-live="polite"`.
- [ ] Нет inline `style`, CSS-модулей и новых зависимостей.
- [ ] Харнес 31–36 зелёный, `lint` и `build` проходят.

### Out of scope

- Очередь с приоритетами, группировка одинаковых сообщений, undo-действия.
- Error/warning/info-варианты тостов и их иконки.
- Настройка длительности и позиции пользователем.

## Decisions

- **Пользователь:** объём A (стор + UI + вызовы); все четыре группы событий; тексты на английском; пример на русском трактуем как описание смысла.
- **Agent's call:** 3000 мс автоскрытия, максимум 3 тоста, ручная кнопка закрытия, без `persist`, без error-тостов, отдельное сообщение `Account created` для регистрации.
- **Agent's call:** таймер в `ToastItem`, а не в сторе — чтобы стор оставался чистой моделью состояния.

## Sources

- Внутренние прецеденты (открыты 2026-11-21): `src/store/authState.ts`, `src/store/favoritesState.ts`, `src/store/themeState.ts`, `src/components/NoteCard.tsx`, `src/App.tsx`, `src/main.css`.
- Внешние справочники по альтернативам (открыты 2026-11-21): https://sonner.emilkowal.ski/ , https://react-hot-toast.com/ — оба покрывают UI, но отклонены из-за новой зависимости и несоответствия задаче на стор.
