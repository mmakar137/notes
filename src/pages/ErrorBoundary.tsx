import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"

type Props = { children: ReactNode }
type State = { error: unknown }

const NO_ERROR = Symbol("no error")

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: NO_ERROR }

  static getDerivedStateFromError(error: unknown): State {
    return { error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("Uncaught error:", error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error === NO_ERROR) {
      return this.props.children
    }

    let details: string
    if (this.state.error instanceof Error) {
      details = this.state.error.message
    } else {
      try {
        details = String(this.state.error)
      } catch {
        details = Object.prototype.toString.call(this.state.error)
      }
    }

    return (
      <div className="mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14">
        <h1 className="mb-9 text-center text-[2.25rem] font-bold tracking-[-0.025em] text-[var(--color-text)]">
          Something went wrong.
        </h1>
        <div
          id="error-fallback"
          className="flex w-full max-w-[560px] flex-col items-center gap-6 rounded-[14px] border border-[#e2e8f0] bg-white p-7 shadow-sm"
        >
          <p className="text-center text-[0.95rem] text-[#64748b]">
            An unexpected error occurred. You can return to the home page and try
            again.
          </p>
          <p className="w-full rounded-[10px] border border-red-500/20 bg-[#fef2f2] px-4 py-3 text-[0.9rem] text-[#ef4444]">
            {details}
          </p>
          <button
            type="button"
            className="rounded-[10px] bg-[#2563eb] p-[11px] text-[0.95rem] font-semibold text-white transition-colors duration-150 hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            onClick={() => {
              window.location.href = "/"
            }}
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }
}
