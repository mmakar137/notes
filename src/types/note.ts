export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
}