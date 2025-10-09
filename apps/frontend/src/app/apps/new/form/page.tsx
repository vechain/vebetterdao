"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../../../components/MotionVStack"
const NewAppPageFormContent = dynamic(
  () => import("./components/NewAppPageFormContent").then(mod => mod.NewAppPageFormContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
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
