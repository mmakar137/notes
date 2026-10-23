import { useForm } from "react-hook-form"

type LoginFormValues = {
  username: string
  password: string
}

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginFormValues>({
    mode: "onBlur",
  })

  const handleLogin = (data: LoginFormValues) => {
    console.log(data)
  }

  return (
    <div>
      <div>Login page</div>
      <form onSubmit={handleSubmit(handleLogin)}>
        <input
          type="text"
          placeholder="Username"
          {...register("username", { required: true })}
        />
        <input
          type="password"
          placeholder="Password"
          {...register("password", { required: true })}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}