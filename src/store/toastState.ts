import { create } from "zustand"

interface Toast {
  id: string
  message: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string) => void
  dismissToast: (id: string) => void
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), message }].slice(-3),
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}))
