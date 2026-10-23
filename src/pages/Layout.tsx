import { useAuthContext } from "../hooks/useAuthContext"
import { Link, Navigate, Outlet } from "react-router"

export default function Layout() {
  const { user, setUser } = useAuthContext()

  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <div>
      <header>
        <div>
          <Link to="/">Notes</Link>
        </div>
        <div>
          <button onClick={() => setUser(null)}>
            Logout
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  )
}