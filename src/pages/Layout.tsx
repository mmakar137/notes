import { useAuthStore } from "../store/authState"
import { useThemeStore } from "../store/themeState"
import { useToastStore } from "../store/toastState"
import { Link, Navigate, Outlet } from "react-router"

export default function Layout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const isDark = useThemeStore((state) => state.isDark)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const addToast = useToastStore((state) => state.addToast)

  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <>
      <header className="bg-gray-100 dark:bg-slate-900 p-4 md:p-8 lg:p-12 flex items-center justify-between">
          <Link className="text-lg font-bold" to="/">Notes</Link>
        <div className="flex items-center gap-2">
          <Link
            className="cursor-pointer rounded-md bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            to="/create"
          >
            Add note
          </Link>
          <Link
            className="cursor-pointer rounded-md bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            to="/notes"
          >
            Back to notes
          </Link>
          <button
            type="button"
            aria-pressed={isDark}
            className="cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-text)] transition-colors duration-150 hover:bg-[var(--color-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            onClick={() => {
              addToast(isDark ? "Light mode enabled" : "Dark mode enabled")
              toggleTheme()
            }}
          >
            {isDark ? "Light mode" : "Dark mode"}
          </button>
          <button
            className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            onClick={() => {
              addToast("Signed out")
              logout()
            }}
          >
            Logout
          </button>
        </div>
      </header>

<main className="p-4 md:p-8 lg:p-12"> 
    <Outlet />
</main>
  
    </>
  )
}