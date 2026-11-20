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
          <button className="text-sm"
          onClick={() => setUser(null)}>
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