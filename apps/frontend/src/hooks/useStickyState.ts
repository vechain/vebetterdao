"use client"
import { useEffect, useState, RefObject } from "react"

export const useStickyState = (sentinelRef: RefObject<HTMLElement>) => {
  const [isStuck, setIsStuck] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsStuck(!entry.isIntersecting)
        }
      },
      { threshold: 1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [sentinelRef])

  return isStuck
}
