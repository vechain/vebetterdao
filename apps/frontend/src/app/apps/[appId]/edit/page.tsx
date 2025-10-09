"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../../../components/MotionVStack"
const EditAppPageContent = dynamic(
  () => import("./components/EditAppPageContent/EditAppPageContent").then(mod => mod.EditAppPageContent),
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
export default function AppEdit({ params }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage(`App/${params.appId}`)
  }, [params.appId])
  return (
    <MotionVStack w="full">
      <EditAppPageContent />
    </MotionVStack>
  )
}
