import { createBrowserRouter, Link, RouterProvider } from "react-router";
import LoginPage from "../src/pages/LoginPage";
import NotesPage from "../src/pages/NotesPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div>
        Home Page
        <div>
          <Link to="/login">Login</Link>
        </div>
      </div>
    ),
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/notes",
    element: <NotesPage />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}