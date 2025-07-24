"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { VStack, Spinner } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const AppDetailPageContent = dynamic(
  () => import("./components/AppDetailPageContent").then(mod => mod.AppDetailPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
type Props = {
  params: {
    appId: string
  }
}

export const AppDetailPage = ({ params }: Props) => {
  useEffect(() => {
    AnalyticsUtils.trackPage(`App/${params.appId}`)
  }, [params.appId])

  return (
    <MotionVStack>
      <AppDetailPageContent />
    </MotionVStack>
  )
}
