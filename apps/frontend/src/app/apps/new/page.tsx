"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const NewAppPageContent = dynamic(() => import("./components/NewAppPageContent").then(mod => mod.NewAppPageContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" gap={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})

export default function NewAppPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewApp")
  }, [])

  return (
    <MotionVStack>
      <NewAppPageContent />
    </MotionVStack>
  )
}
