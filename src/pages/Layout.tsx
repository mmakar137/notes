import { useAuthStore } from "../store/authState"
import { Link, Navigate, Outlet } from "react-router"

export default function Layout() {
  const { user, logout } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <>
      <header className="bg-gray-100 p-4 md:p-8 lg:p-12 flex items-center justify-between">
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
            className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            onClick={() => logout()}
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