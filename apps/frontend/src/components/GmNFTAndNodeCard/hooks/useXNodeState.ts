import { useXNode } from "@/api"
import { useCallback } from "react"
import { useRouter } from "next/navigation"

export const useXNodeState = (profile?: string) => {
  const { xNodeName, xNodeImage, xNodePoints, isXNodeHolder, isXNodeDelegator, isXNodeDelegatee } = useXNode(profile)

  const router = useRouter()
  const goToXNodePage = useCallback(() => {
    router.push("/xnode")
  }, [router])

  return {
    xNodeName,
    xNodeImage,
    xNodePoints,
    isXNodeHolder,
    isXNodeDelegator,
    isXNodeDelegatee,
    goToXNodePage,
  }
}
