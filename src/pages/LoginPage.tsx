import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { useAuthContext } from "../hooks/authContext"

type LoginFormValues = {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const {setUser} = useAuthContext()
  const [serverError, setServerError] = useState("")

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid } 
  } = useForm<LoginFormValues>({
    mode: "onChange",
  })

  const handleLogin = (data: LoginFormValues) => {
    setServerError("") 
    const params = new URLSearchParams()
    params.set("email", data.email)

    fetch(`http://localhost:3000/users?${params.toString()}`)
      .then((res) => res.json())
      .then((users) => {
        if (users && users.length > 0 && users.some((user: { password: string }) => user.password === data.password)) {
          setUser(users)
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
    <div>
      <div>Login page</div>
      <form onSubmit={handleSubmit(handleLogin)}>
        <div>
          <input
            type="text"
            placeholder="Email"
            {...register("email", { 
              required: "Введите email",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Некорректный email" }
            })}
          />
          {errors.email && <p style={{ color: 'red', margin: '5px 0', fontSize: '12px' }}>{errors.email.message}</p>}
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            {...register("password", { 
              required: "Введите пароль",
              minLength: { value: 4, message: "Минимум 4 символа" }
            })}
          />
          {errors.password && <p style={{ color: 'red', margin: '5px 0', fontSize: '12px' }}>{errors.password.message}</p>}
        </div>

        {serverError && <p style={{ color: 'red', margin: '10px 0', fontWeight: 'bold' }}>{serverError}</p>}

        <button type="submit" disabled={!isValid}>Login</button>
      </form>
      <Link
        to="/register"
        className="mt-4 inline-block text-[0.9rem] font-medium text-[#2563eb] no-underline transition-colors duration-150 hover:text-[#1d4ed8]"
      >
        Register
      </Link>
    </div>
  )
}