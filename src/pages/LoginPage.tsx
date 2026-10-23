import { useForm } from "react-hook-form"

type LoginFormValues = {
  username: string
  password: string
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    mode: "onBlur",
  })

  const handleLogin = (data: LoginFormValues) => {
    console.log(data)
  }

  return (
    <div>
      <div>Login page</div>
      <form onSubmit={handleSubmit(handleLogin)}>
        <div>
          <input
            type="text"
            placeholder="Username"
            {...register("username", { 
              required: "Введите имя пользователя",
              minLength: { value: 3, message: "Минимум 3 символа" },
              pattern: { value: /^[a-zA-Z0-9]+$/, message: "Только латиница и цифры" }
            })}
          />
          {errors.username && <p style={{ color: 'red', margin: '5px 0', fontSize: '12px' }}>{errors.username.message}</p>}
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

        <button type="submit">Login</button>
      </form>
    </div>
  )
}