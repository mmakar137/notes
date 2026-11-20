import { useState } from "react"
import type { User } from "../types"
import { AuthContext } from "./authContext"

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
    const [user, setUser] = useState<User | null>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("user")!) || null
      )
    } catch {
      return null
    }
  })

  // Вот наша функция с правильным аргументом newUser
  const handleUserChange = (newUser: User | null) => {
    setUser(newUser)
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser))
    } else {
      localStorage.removeItem("user")
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser: handleUserChange }}>
      {children}
    </AuthContext.Provider>
  )
}