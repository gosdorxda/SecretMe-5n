"use client"

import { useRef, useCallback } from "react"

/**
 * A hook that returns a stable callback function that always uses the latest props/state
 * This is a stable alternative to the experimental useEffectEvent hook
 *
 * @param callback The callback function that should use the latest props/state
 * @returns A stable callback function
 */
export function useStableHandler<T extends (...args: any[]) => any>(callback: T): T {
  // Store the callback in a ref so we always have the latest version
  const callbackRef = useRef(callback)

  // Update the ref whenever the callback changes
  callbackRef.current = callback

  // Return a stable callback that uses the ref
  return useCallback(
    ((...args) => {
      return callbackRef.current(...args)
    }) as T,
    [],
  )
}
