# Клиентское состояние цветовой схемы — дизайн

Дата: 2026-11-21. Статус: **ожидает одобрения пользователя**.

## Цель

Третий Zustand-стор для выбора темы (тёмная/светлая), сохранение выбора в `localStorage`, видимый переключатель и реальное применение темы ко всем поверхностям приложения. Продолжение задания «Zustand & client state» по образцу сторов `auth` и `favorites`.

## Не делаем

- Системную тему `prefers-color-scheme` как источник выбора: по умолчанию всегда светлая, системная настройка не читается.
- Третье состояние «как в системе» — только два значения.
- Изменение акцентного синего (`#2563eb`) и красного ошибок в тёмной теме — они остаются читаемыми в обеих схемах.
- Изменение структуры компонентов, роутов, логики заметок и избранного.
- Тесты внутри репозитория — все проверки только во внешнем CDP-харнесе.

## Решение 1. Стор

Новый файл `src/store/themeState.ts`, форма по образцу `src/store/authState.ts` и `src/store/favoritesState.ts`:

```ts
interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
}

create<ThemeState>()(persist(..., { name: "theme" }))
```

- Ключ `localStorage`: `theme`. Форма: `{"state":{"isDark":true},"version":0}`.
- Начальное значение `false` (светлая тема).
- `toggleTheme` использует `set((state) => ...)` — та же иммутабельная форма, что `toggleFavorite`.
- Потребители берут только узкие селекторы: `useThemeStore((s) => s.isDark)` и `useThemeStore((s) => s.toggleTheme)` — без деструктурирования всего стора.

## Решение 2. Применение класса

- В `src/App.tsx` (корневой компонент, вне `Layout`, чтобы тема работала и на `/login`, `/register`, `/`):
  `const isDark = useThemeStore((s) => s.isDark)` и `useEffect(() => document.documentElement.classList.toggle("dark", isDark), [isDark])`.
- `classList.toggle(..., boolean)` идемпотентен — повторный вызов под `StrictMode` безопасен.
- В `index.html` в `<head>` — небольшой синхронный `<script>`, который читает `localStorage.theme` и ставит класс `dark` до загрузки CSS, чтобы не было вспышки светлой темы при перезагрузке (паттерн из доков Tailwind v4.3). Он дублирует ключ `theme` и путь `state.isDark` — это неизбежная цена запуска до React.

## Решение 3. Токены CSS

`src/main.css` — единственный источник цветов. Светлые значения **ровно те же**, что сейчас в разметке, чтобы не сломать существующие проверки computed styles.

| Токен | Светлая | Тёмная | Что заменяет |
|---|---|---|---|
| `--color-bg` | `#f8fafc` | `#0f172a` | фон `body` |
| `--color-text` | `#0f172a` | `#f8fafc` | `text-[#0f172a]`, `text-slate-900`, цвет текста `body` |
| `--color-text-muted` | `#64748b` | `#94a3b8` | `text-[#64748b]` |
| `--color-placeholder` | `#94a3b8` | `#64748b` | `placeholder:text-[#94a3b8]` |
| `--color-surface` | `#ffffff` | `#1e293b` | `bg-white` (карточки, формы, поля, дропдаун) |
| `--color-surface-muted` | `#f8fafc` | `#334155` | `hover:bg-[#f8fafc]` |
| `--color-border` | `#e2e8f0` | `#334155` | `border-[#e2e8f0]`, `border-slate-200` |
| `--color-accent-soft` | `#eff6ff` | `#1e3a5f` | `hover:bg-blue-50` |
| `--color-error-bg` | `#fef2f2` | `#451a1a` | `bg-[#fef2f2]` |
| `--color-error-text` | `#ef4444` | `#fca5a5` | `text-[#ef4444]` |

- Токены объявляются в `:root`, тёмные значения — в `.dark` внутри того же `@layer base`.
- Замены в разметке идут на Tailwind arbitrary values: `bg-[var(--color-surface)]`, `text-[var(--color-text)]` и т.п. Это уже используется в проекте (`text-[var(--color-text)]` в `App.tsx`), не inline-style и не CSS-модули.
- Шапка `Layout` сохраняет `bg-gray-100` в светлой теме и получает `dark:bg-slate-900` через `@custom-variant dark (&:where(.dark, .dark *));` в `main.css`.

## Решение 4. Переключатель

В шапке `src/pages/Layout.tsx` рядом с существующими кнопками:

- `<button type="button">` с видимым англоязычным текстом `Dark mode` / `Light mode` (название действия).
- `aria-pressed={isDark}` для доступности.
- Нейтральный стиль по образцу других кнопок шапки: граница, `bg-[var(--color-surface)]`, текст `var(--color-text)`, hover `var(--color-surface-muted)`, focus-visible outline.
- Переключатель виден только авторизованным пользователям (`Layout` требует `user`), но тема применяется глобально через `App`.

## Grounding

- Установленные версии из `node_modules` (проверено 2026-11-21): `tailwindcss@4.3.3`, `zustand@5.1.0`.
- Синтаксис `@custom-variant dark (&:where(.dark, .dark *));` и рекомендация ставить класс на `<html>` — официальные доки Tailwind v4.3, https://tailwindcss.com/docs/dark-mode (открыто 2026-11-21).

## Файлы

| Файл | Изменение |
|---|---|
| `src/store/themeState.ts` | новый стор |
| `src/App.tsx` | синхронизация `.dark` |
| `index.html` | синхронный pre-hydration скрипт |
| `src/main.css` | токены, `.dark`, `@custom-variant` |
| `src/pages/Layout.tsx` | кнопка + узкие селекторы |
| `src/App.tsx`, `src/components/*.tsx`, остальные `src/pages/*.tsx` | замена жёстких цветов на токены |

## Проверка

1. Внешний харнес `D:\opencode\tmp\opencode\tag-dropdown-test.mjs`: новые задачи 26–30 (значение по умолчанию, toggle, persist после reload, повторный toggle, computed colors) + полный регресс 1–25 (№4 с `--empty`).
2. `npm run lint`, `npm run build`.
3. Коммит и push делает пользователь; агент код не коммитит.

## Риски

- Pre-hydration скрипт дублирует ключ `theme` — при изменении формы стора его нужно обновить вместе.
- Замена 62 классов — механическая, но затронет 13 файлов; регресс проверяется полным прогоном харнеса, светлые computed-значения обязаны совпасть.
- Внешний вид тёмной темы агент не видит (нет просмотра скриншотов) — финальную визуальную оценку делает пользователь.
