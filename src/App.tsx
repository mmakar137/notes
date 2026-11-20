import { useEffect } from "react";
import { createBrowserRouter, Link, Outlet, RouterProvider } from "react-router";
import { useThemeStore } from "./store/themeState";
import LoginPage from "../src/pages/LoginPage";
import NotesPage from "./pages/notesPage";
import CreateNotePage from "./pages/CreateNotePage";
import RegisterPage from "./pages/RegisterPage";
import EditNotePage from "./pages/EditNotePage";
import NoteViewPage from "./pages/NoteViewPage";
import ErrorBoundary from "./pages/ErrorBoundary";
import Layout from "./pages/Layout";
import NotFoundPage from "./pages/NotFoundPage";

const router = createBrowserRouter([
  {
    element: (
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    ),
    children: [
  {
    path: "/",
    element: (
      <div className="mx-auto flex min-h-screen max-w-[1080px] items-center justify-center px-5 py-14">
        <div className="flex w-full max-w-[560px] flex-col items-center gap-6 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-sm">
          <h1 className="text-center text-[2.25rem] font-bold tracking-[-0.025em] text-[var(--color-text)]">
            Home Page
          </h1>
          <p className="-mt-3 text-center text-[0.95rem] text-[var(--color-text-muted)]">
            Keep your notes organized. Sign in or create an account to get started.
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-[11px] text-center text-[0.95rem] font-semibold text-[#2563eb] transition-colors duration-150 hover:bg-[var(--color-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              to="/login"
            >
              Login
            </Link>
            <Link
              className="rounded-[10px] bg-[#2563eb] p-[11px] text-center text-[0.95rem] font-semibold text-white transition-colors duration-150 hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              to="/register"
            >
              Register
            </Link>
          </div>
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
      {
        path: "/notes/:id",
        element: <NoteViewPage />,
      },
      {
        path: "/notes/:id/edit",
        element: <EditNotePage />,
      },
    ],
  },

  {
    path: "/notes",
    element: <NotesPage />,
  },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default function App() {
  const isDark = useThemeStore((state) => state.isDark)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  return( 
  <ErrorBoundary>
  <RouterProvider router={router} />
  </ErrorBoundary>
  );
}
