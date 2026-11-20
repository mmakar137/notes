import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { useAuthContext } from "../hooks/authContext"
import type { User } from "../types"
import { DB_LINK } from "../utils"

type RegisterFormValues = {
  email: string
  password: string
}

const fieldClass =
  "w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-[0.95rem] text-[#0f172a] placeholder:text-[#94a3b8] transition-[border-color,box-shadow] duration-150 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] focus:outline-none"

export default function RegisterPage() {
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuthContext()

  const {
    register,
    handleSubmit: submitForm,
    formState: { errors, isValid },
  } = useForm<RegisterFormValues>({
    mode: "onChange",
  })

  const handleSubmit = async (values: RegisterFormValues): Promise<void> => {
    setError("")
    setIsSubmitting(true)
    try {
      const checkRes = await fetch(
        `${DB_LINK}/users?email=${encodeURIComponent(values.email)}`
      )
      if (!checkRes.ok) throw new Error(`HTTP ${checkRes.status}`)
      const existing: User[] = await checkRes.json()
      if (existing.length > 0) {
        setError("Этот email уже занят")
        return
      }

      const allRes = await fetch(`${DB_LINK}/users`)
      if (!allRes.ok) throw new Error(`HTTP ${allRes.status}`)
      const allUsers: User[] = await allRes.json()
      if (
        Array.isArray(allUsers) &&
        allUsers.some(
          (user) =>
            typeof user.email === "string" &&
            user.email.toLowerCase() === values.email.toLowerCase()
        )
      ) {
        setError("Этот email уже занят")
        return
      }

      const createRes = await fetch(`${DB_LINK}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!createRes.ok) throw new Error(`HTTP ${createRes.status}`)
      const created: User = await createRes.json()
      if (
        !created ||
        typeof created.id !== "string" ||
        !created.id ||
        typeof created.email !== "string" ||
        !created.email ||
        typeof created.password !== "string" ||
        !created.password
      ) {
        throw new Error("Invalid created user")
      }

      setUser({
        id: created.id,
        email: created.email,
        password: created.password,
      })
      navigate("/notes")
    } catch {
      setError("Ошибка сервера. Проверьте, запущен ли json-server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14">
      <h1 className="mb-9 text-center text-[2.25rem] font-bold tracking-[-0.025em] text-[var(--color-text)]">
        Register
      </h1>
      {error && (
        <p className="mb-6 w-full max-w-[560px] rounded-[10px] border border-red-500/20 bg-[#fef2f2] px-4 py-3 text-[0.9rem] text-[#ef4444]">
          {error}
        </p>
      )}
      <form
        className="mb-14 flex w-full max-w-[560px] flex-col gap-[18px] rounded-[14px] border border-[#e2e8f0] bg-white p-7 shadow-sm transition-shadow duration-200 focus-within:shadow-md"
        onSubmit={submitForm(handleSubmit)}
      >
        <div className="flex flex-col gap-1.5">
          {errors.email && (
            <p className="text-[0.825rem] font-medium text-[#ef4444]">
              {errors.email.message}
            </p>
          )}
          <label
            htmlFor="register-email"
            className="flex flex-col gap-1.5 text-[0.9rem] font-medium text-[#0f172a]"
          >
            Email
            <input
              id="register-email"
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
            htmlFor="register-password"
            className="flex flex-col gap-1.5 text-[0.9rem] font-medium text-[#0f172a]"
          >
            Password
            <input
              id="register-password"
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
          disabled={!isValid || isSubmitting}
          className="rounded-[10px] bg-[#2563eb] p-[11px] text-[0.95rem] font-semibold text-white transition-colors duration-150 hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Register"}
        </button>
      </form>
      <Link
        to="/login"
        className="text-[0.9rem] font-medium text-[#2563eb] no-underline transition-colors duration-150 hover:text-[#1d4ed8]"
      >
        Back to login
      </Link>
    </div>
  )
}
