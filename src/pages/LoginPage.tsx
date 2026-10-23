import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"

type LoginFormValues = {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  // Добавляем состояние для ошибки сервера
  const [serverError, setServerError] = useState("")

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid } 
  } = useForm<LoginFormValues>({
    mode: "onChange",
  })

  const handleLogin = (data: LoginFormValues) => {
    setServerError("") // Сбрасываем старую ошибку при новой попытке
    const params = new URLSearchParams()
    params.set("email", data.email)
    params.set("password", data.password)
    
    fetch(`http://localhost:3000/users?${params.toString()}`)
      .then((res) => res.json())
      .then((user) => {
        if (user && user.length > 0) {
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

        {/* Вывод ошибки сервера (если пароль неверный или сервер упал) */}
        {serverError && <p style={{ color: 'red', margin: '10px 0', fontWeight: 'bold' }}>{serverError}</p>}

        <button type="submit" disabled={!isValid}>Login</button>
      </form>
    </div>
  )
}