import { useEffect } from "react"
import { useToastStore } from "../store/toastState"

interface ToastItemProps {
  id: string
  message: string
}

function ToastItem({ id, message }: ToastItemProps) {
  const dismissToast = useToastStore((state) => state.dismissToast)

  useEffect(() => {
    const timer = window.setTimeout(() => dismissToast(id), 3000)
    return () => window.clearTimeout(timer)
  }, [dismissToast, id])

  return (
    <div
      data-toast
      data-toast-id={id}
      className="pointer-events-auto flex items-start gap-3 rounded-[10px] border border-[var(--color-border)] border-l-4 border-l-emerald-500 bg-[var(--color-surface)] px-4 py-3 text-[0.9rem] text-[var(--color-text)] shadow-md"
    >
      <span className="flex-1 break-words">{message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-[var(--color-text-muted)] transition-colors duration-150 hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        onClick={() => dismissToast(id)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  )
}

export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-80"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} id={toast.id} message={toast.message} />
      ))}
    </div>
  )
}
