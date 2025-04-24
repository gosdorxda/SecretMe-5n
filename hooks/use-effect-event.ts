"use client"

import { useCallback, useRef } from "react"

// Polyfill untuk useEffectEvent
export function useEffectEvent<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback((...args: any[]) => callbackRef.current(...args), []) as T
}

// Ekspor untuk kompatibilitas dengan @radix-ui/react-use-effect-event
export default useEffectEvent
