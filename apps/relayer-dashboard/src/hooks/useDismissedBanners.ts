"use client"

import { useCallback, useState } from "react"

const STORAGE_KEY = "relayer-dismissed-banners"

function getStoredDismissals(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

export function useDismissedBanner(bannerKey: string) {
  const [isDismissed, setIsDismissed] = useState(() => getStoredDismissals()[bannerKey] === true)

  const dismiss = useCallback(() => {
    const current = getStoredDismissals()
    current[bannerKey] = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    setIsDismissed(true)
  }, [bannerKey])

  return { isDismissed, dismiss }
}
