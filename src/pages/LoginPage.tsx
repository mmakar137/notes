import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { useAuthStore } from "../store/authState"
import type { User } from "../types"

type LoginFormValues = {
  email: string
  password: string
}

const fieldClass =
  "w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-[0.95rem] text-[#0f172a] placeholder:text-[#94a3b8] transition-[border-color,box-shadow] duration-150 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] focus:outline-none"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    mode: "onChange",
  })

  const handleLogin = (data: LoginFormValues) => {
    setServerError("")
    const params = new URLSearchParams()
    params.set("email", data.email)

    fetch(`http://localhost:3000/users?${params.toString()}`)
      .then((res) => res.json())
      .then((users: User[]) => {
        const matched = users.find(
          (user) =>
            user.password === data.password &&
            typeof user.id === "string" &&
            user.id
        )
        if (matched) {
          login({
            id: matched.id,
            email: String(matched.email),
            password: String(matched.password),
          })
          navigate("/notes")
        } else {
          setServerError("Неверный email или пароль")
        }
      })
      .catch(() => {
        setServerError("Ошибка сервера. Проверьте, запущен ли json-server.")
      })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14">
      <h1 className="mb-9 text-center text-[2.25rem] font-bold tracking-[-0.025em] text-[var(--color-text)]">
        Login page
      </h1>
      {serverError && (
        <p className="mb-6 w-full max-w-[560px] rounded-[10px] border border-red-500/20 bg-[#fef2f2] px-4 py-3 text-[0.9rem] text-[#ef4444]">
          {serverError}
        </p>
      )}
      <form
        className="mb-14 flex w-full max-w-[560px] flex-col gap-[18px] rounded-[14px] border border-[#e2e8f0] bg-white p-7 shadow-sm transition-shadow duration-200 focus-within:shadow-md"
        onSubmit={handleSubmit(handleLogin)}
      >
        <div className="flex flex-col gap-1.5">
          {errors.email && (
            <p className="text-[0.825rem] font-medium text-[#ef4444]">
              {errors.email.message}
            </p>
          )}
          <label
            htmlFor="login-email"
            className="flex flex-col gap-1.5 text-[0.9rem] font-medium text-[#0f172a]"
          >
            Email
            <input
              id="login-email"
              type="text"
              placeholder="Email"
              className={fieldClass}
              {...register("email", {
                required: "Введите email",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Некорректный email",
                },
              })}
            />
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          {errors.password && (
            <p className="text-[0.825rem] font-medium text-[#ef4444]">
              {errors.password.message}
            </p>
          )}
          <label
            htmlFor="login-password"
            className="flex flex-col gap-1.5 text-[0.9rem] font-medium text-[#0f172a]"
          >
            Password
            <input
              id="login-password"
              type="password"
              placeholder="Password"
              className={fieldClass}
              {...register("password", {
                required: "Введите пароль",
                minLength: { value: 4, message: "Минимум 4 символа" },
              })}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className="rounded-[10px] bg-[#2563eb] p-[11px] text-[0.95rem] font-semibold text-white transition-colors duration-150 hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Login
        </button>
      </form>
      <Link
        to="/register"
        className="text-[0.9rem] font-medium text-[#2563eb] no-underline transition-colors duration-150 hover:text-[#1d4ed8]"
      >
        Register
      </Link>
    </div>
  )
}
