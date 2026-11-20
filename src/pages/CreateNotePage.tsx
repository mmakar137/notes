import { useState } from "react"
import { useNavigate } from "react-router"
import CreateNoteForm from "../components/CreateNoteForm"
import type { Note } from "../types"
import { DB_LINK } from "../utils"

export default function CreateNotePage() {
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = (note: Note): Promise<boolean> => {
    setError("")
    return fetch(`${DB_LINK}/notes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(() => {
        navigate("/notes")
        return true
      })
      .catch(() => {
        setError("Could not save the note.")
        return false
      })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14">
      <h1 className="mb-9 text-center text-[2.25rem] font-bold tracking-[-0.025em] text-[var(--color-text)]">
        Create note
      </h1>
      {error && (
        <p className="mb-6 w-full max-w-[560px] rounded-[10px] border border-red-500/20 bg-[#fef2f2] px-4 py-3 text-[0.9rem] text-[#ef4444]">
          {error}
        </p>
      )}
      <CreateNoteForm onSubmit={handleSubmit} />
    </div>
  )
}
