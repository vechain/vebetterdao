"use client"
import { useSignalerAssignedToApp } from "@/api"
import { useParams } from "next/navigation"
import { useMemo } from "react"

/**
 * Hook that fetches the app id from the URL and returns the app info
 *
 * @returns the app info
 */
export const useCurrentAppSignalers = () => {
  const { appId } = useParams<{ appId: string }>()
  const {
    data: { activeSignalers },
    isLoading,
  } = useSignalerAssignedToApp(appId ?? "")

  // Memoize the event fetching to avoid unnecessary re-renders
  const memoizedSignalers = useMemo(() => activeSignalers || [], [activeSignalers])

  return {
    activeSignalers: memoizedSignalers,
    isLoading,
  }
}
