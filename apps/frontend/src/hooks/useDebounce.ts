import { useEffect, useState } from "react"

/**
 * Custom hook for debouncing values
 * Useful for search inputs to avoid excessive API calls or heavy computations
 * Inspired by https://hooks-ts.com/docs/useDebounce#hook
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}
