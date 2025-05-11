"use client"

import { useState, useCallback } from "react"

type FeedbackState = "idle" | "loading" | "success" | "error"

interface UseFeedbackAnimationProps {
  successDuration?: number
  errorDuration?: number
  onSuccess?: () => void
  onError?: () => void
  onComplete?: () => void
}

export function useFeedbackAnimation({
  successDuration = 2000,
  errorDuration = 2000,
  onSuccess,
  onError,
  onComplete,
}: UseFeedbackAnimationProps = {}) {
  const [state, setState] = useState<FeedbackState>("idle")

  const startLoading = useCallback(() => {
    setState("loading")
  }, [])

  const setSuccess = useCallback(() => {
    setState("success")
    if (onSuccess) onSuccess()

    const timer = setTimeout(() => {
      setState("idle")
      if (onComplete) onComplete()
    }, successDuration)

    return () => clearTimeout(timer)
  }, [onSuccess, onComplete, successDuration])

  const setError = useCallback(() => {
    setState("error")
    if (onError) onError()

    const timer = setTimeout(() => {
      setState("idle")
      if (onComplete) onComplete()
    }, errorDuration)

    return () => clearTimeout(timer)
  }, [onError, onComplete, errorDuration])

  const reset = useCallback(() => {
    setState("idle")
  }, [])

  return {
    state,
    isLoading: state === "loading",
    isSuccess: state === "success",
    isError: state === "error",
    isIdle: state === "idle",
    startLoading,
    setSuccess,
    setError,
    reset,
  }
}
