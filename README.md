# Notes

Приложение для заметок на React и TypeScript. Заметки хранятся на локальном сервере [json-server](https://github.com/typicode/json-server) в файле `db.json`.

## Возможности

- Создание заметки: заголовок, текст, теги, отметка «скрытая»
- Удаление заметки
- Проверка формы: заголовок обязателен (до 100 символов), текст до 2000 символов, не больше 5 тегов

## Технологии

React 19, TypeScript, Vite, json-server

## Запуск

```bash
npm install
npm run db    # сервер с данными: http://localhost:3000
npm run dev   # приложение: http://localhost:5173
```

`npm run db` и `npm run dev` запускаются в двух разных терминалах.

## Скрипты

| Команда           | Что делает                                |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | запуск в режиме разработки                |
| `npm run db`      | запуск json-server с данными из `db.json` |
| `npm run build`   | сборка проекта                            |
| `npm run lint`    | проверка кода ESLint                      |
| `npm run preview` | просмотр собранной версии                 |

## Структура

```
src/
  App.tsx             главный компонент: загрузка, добавление и удаление заметок
  CreateNoteForm.tsx  форма создания заметки
  NoteCard.tsx        карточка заметки
  types.ts            типы Note и NoteDTO
  utils.ts            адрес сервера и преобразование данных
db.json               данные для json-server
```
