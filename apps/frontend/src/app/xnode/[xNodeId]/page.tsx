"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { use, useEffect } from "react"

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
  params: Promise<{ xNodeId: string }>
}
export default function XNodePage({ params }: Readonly<Props>) {
  const { xNodeId } = use(params)
  useEffect(() => {
    AnalyticsUtils.trackPage("XNodePage")
  }, [])
  return (
    <MotionVStack>
      <XNodeContent xNodeId={xNodeId} />
    </MotionVStack>
  )
}
