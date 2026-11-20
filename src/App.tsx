import { createBrowserRouter, Link, RouterProvider } from "react-router";
import LoginPage from "../src/pages/LoginPage";
import NotesPage from "./pages/notesPage";
import CreateNotePage from "./pages/CreateNotePage";
import RegisterPage from "./pages/RegisterPage";
import { AuthProvider } from "./hooks/useAuthContext";
import Layout from "./pages/Layout";

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
    path: "/register",
    element: <RegisterPage />,
  },
    {
    element: <Layout />,
    children: [
      {
        path: "/notes",
        element: <NotesPage />,
      },
      {
        path: "/create",
        element: <CreateNotePage />,
      },
    ],
  },

  {
    path: "/notes",
    element: <NotesPage />,
  },
]);

export default function App() {
  return( 
  <AuthProvider>
  <RouterProvider router={router} />
    </AuthProvider>
  );
}