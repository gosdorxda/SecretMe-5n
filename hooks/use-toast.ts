"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ToastActionElement, ToastProps as ToastComponentProps } from "@/components/ui/toast"

type ToastProps = ToastComponentProps & {
  variant?: "default" | "destructive" | "success" | "warning"
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 4000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
  CLEAR_ALL: "CLEAR_ALL",
} as const

let count = 0

function generateId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["CLEAR_ALL"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // Cek apakah toast dengan ID yang sama sudah ada
      if (state.toasts.find((t) => t.id === action.toast.id)) {
        return state
      }

      // Cek apakah toast dengan pesan yang sama sudah ada
      const existingToastIndex = state.toasts.findIndex(
        (t) =>
          t.title === action.toast.title &&
          t.description === action.toast.description &&
          t.variant === action.toast.variant,
      )

      // Jika ada, hapus toast yang lama
      if (existingToastIndex !== -1) {
        const newToasts = [...state.toasts]
        newToasts.splice(existingToastIndex, 1)
        return {
          ...state,
          toasts: [action.toast, ...newToasts].slice(0, TOAST_LIMIT),
        }
      }

      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        if (toastTimeouts.has(toastId)) {
          clearTimeout(toastTimeouts.get(toastId))
          toastTimeouts.delete(toastId)
        }
      } else {
        for (const [id, timeout] of Array.from(toastTimeouts.entries())) {
          clearTimeout(timeout)
          toastTimeouts.delete(id)
        }
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    case "CLEAR_ALL":
      // Clear all timeouts
      for (const [id, timeout] of Array.from(toastTimeouts.entries())) {
        clearTimeout(timeout)
        toastTimeouts.delete(id)
      }
      return {
        ...state,
        toasts: [],
      }
  }
}

// Singleton pattern untuk memastikan hanya ada satu instance state
let memoryState: State = { toasts: [] }
const listeners: Array<(state: State) => void> = []

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Debounce function untuk mencegah multiple toast dalam waktu singkat
let toastDebounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_INTERVAL = 300 // ms

type ToastInput = Omit<ToasterToast, "id">

function toast({ ...props }: ToastInput) {
  const id = generateId()

  // Hapus toast dengan pesan yang sama jika ada
  const existingToast = memoryState.toasts.find(
    (t) => t.title === props.title && t.description === props.description && t.variant === props.variant,
  )

  if (existingToast) {
    dispatch({ type: "DISMISS_TOAST", toastId: existingToast.id })
  }

  // Debounce toast creation
  if (toastDebounceTimer) {
    clearTimeout(toastDebounceTimer)
  }

  toastDebounceTimer = setTimeout(() => {
    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id })
        },
      },
    })

    // Auto dismiss
    const timeoutId = setTimeout(() => {
      dispatch({ type: "DISMISS_TOAST", toastId: id })
    }, TOAST_REMOVE_DELAY)

    toastTimeouts.set(id, timeoutId)

    toastDebounceTimer = null
  }, DEBOUNCE_INTERVAL)

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = useState<State>(memoryState)

  useEffect(() => {
    // Clear all toasts when component mounts to prevent duplicates
    dispatch({ type: "CLEAR_ALL" })

    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    clearAll: () => dispatch({ type: "CLEAR_ALL" }),
  }
}

export { useToast, toast }
