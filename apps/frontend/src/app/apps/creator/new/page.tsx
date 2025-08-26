"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const NewCreatorPageFormContent = dynamic(
  () => import("./components/NewCreatorPageFormContent").then(mod => mod.NewCreatorPageFormContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function NewCreatorPageForm() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewCreatorForm")
  }, [])

  return (
    <MotionVStack>
      <NewCreatorPageFormContent />
    </MotionVStack>
  )
}
