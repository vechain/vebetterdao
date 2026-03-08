"use client"

import { useCallback, useState } from "react"

const STORAGE_KEY = "relayer-tracked-address"

function getStoredAddress(): string {
  if (typeof window === "undefined") return ""
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

/** Persist a relayer address in localStorage for tracking. */
export function useTrackedRelayer() {
  const [address, setAddressState] = useState(getStoredAddress)

  const setAddress = useCallback((addr: string) => {
    const normalized = addr.trim().toLowerCase()
    localStorage.setItem(STORAGE_KEY, normalized)
    setAddressState(normalized)
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setAddressState("")
  }, [])

  return { address, setAddress, clear, hasAddress: address.length > 0 }
}
