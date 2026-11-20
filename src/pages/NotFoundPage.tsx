import { Link } from "react-router"

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14">
      <h1 className="mb-9 text-center text-[2.25rem] font-bold tracking-[-0.025em] text-[var(--color-text)]">
        Page not found.
      </h1>
      <div className="flex w-full max-w-[560px] flex-col items-center gap-6 rounded-[14px] border border-[#e2e8f0] bg-white p-7 shadow-sm">
        <div id="not-found" className="flex w-full flex-col items-center gap-6">
          <p className="text-center text-[0.95rem] text-[#64748b]">
            The page you are looking for does not exist.
          </p>
          <Link
            className="rounded-[10px] bg-[#2563eb] p-[11px] text-center text-[0.95rem] font-semibold text-white transition-colors duration-150 hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            to="/"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
