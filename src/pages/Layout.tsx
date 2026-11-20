import { useAuthContext } from "../hooks/authContext"
import { Link, Navigate, Outlet } from "react-router"

export default function Layout() {
  const { user, setUser } = useAuthContext()

  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <>
      <header className="bg-gray-100 p-4 md:p-8 lg:p-12 flex items-center justify-between">
          <Link className="text-lg font-bold" to="/">Notes</Link>
        <div>
          <button
            className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            onClick={() => setUser(null)}
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