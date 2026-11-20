import { useState } from "react"
import { useNavigate } from "react-router"
import CreateNoteForm from "../components/CreateNoteForm"

export default function CreateNotePage() {
  const [error] = useState("")
  const navigate = useNavigate()

  const handleSubmit = (): Promise<boolean> => {
    navigate("/notes")
    return Promise.resolve(true)
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
