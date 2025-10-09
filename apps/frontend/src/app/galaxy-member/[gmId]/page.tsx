"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../../components/MotionVStack"
const GmNFTPageContent = dynamic(
  () => import("../components/GmNFTPageContent/GmNFTPageContent").then(mod => mod.GmNFTPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
export default function GMNFTPage({ params }: { params: { gmId: string } }) {
  useEffect(() => {
    AnalyticsUtils.trackPage("GMNFTPage")
  }, [])
  return (
    <MotionVStack>
      <GmNFTPageContent gmId={params.gmId} />
    </MotionVStack>
  )
}
