export interface Note {
  id: string
  authorId?: string
  title: string
  content: string
  createdAt: Date
  hidden: boolean
  tags: string[]
}

export interface NoteDTO {
  id: string
  authorId?: string
  title: string
  content: string
  createdAt: string
  hidden: boolean
  tags: string[]
}

export type NoteFilters = Record<
  string,
  (params: URLSearchParams) => void
>

export interface User {
  "id": string
  "email": string
  "password": string
}
