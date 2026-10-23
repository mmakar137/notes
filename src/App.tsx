import { createBrowserRouter, Link } from "react-router";
import { RouterProvider } from "react-router/dom";
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
    element: <div>Hello login</div>,
  },
]);
export default function App() {
  return <RouterProvider router={router} />
}