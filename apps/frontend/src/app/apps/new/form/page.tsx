"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const NewAppPageFormContent = dynamic(
  () => import("./components/NewAppPageFormContent").then(mod => mod.NewAppPageFormContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function NewAppPageForm() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewApp")
  }, [])

  return (
    <MotionVStack>
      <NewAppPageFormContent />
    </MotionVStack>
  )
}
