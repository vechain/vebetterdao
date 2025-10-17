"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../../components/MotionVStack"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
const XNodeContent = dynamic(() => import("../XNodeContent/XNodeContent").then(mod => mod.XNodeContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" gap={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})
type Props = {
  params: {
    xNodeId: string
  }
}
export default function XNodePage({ params }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage("XNodePage")
  }, [])
  return (
    <MotionVStack>
      <XNodeContent xNodeId={params.xNodeId} />
    </MotionVStack>
  )
}
