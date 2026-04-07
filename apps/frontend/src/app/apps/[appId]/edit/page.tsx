"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { use, useEffect } from "react"

import { MotionVStack } from "../../../../components/MotionVStack"
import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"
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
  params: Promise<{ appId: string }>
}
export default function AppEdit({ params }: Readonly<Props>) {
  const { appId } = use(params)
  useEffect(() => {
    AnalyticsUtils.trackPage(`App/${appId}`)
  }, [appId])
  return (
    <MotionVStack w="full">
      <EditAppPageContent />
    </MotionVStack>
  )
}
