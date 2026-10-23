import { createBrowserRouter, Link } from "react-router";
import { RouterProvider } from "react-router/dom";
import LoginPage from "./pages/loginPage";
const router = createBrowserRouter([
  {
    path: "/",
    element: <div>
      Home Page
      <div>
      <Link to="/login">Login</Link>
      </div>
      </div>,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);
export default function App() {
  return <RouterProvider router={router} />
}