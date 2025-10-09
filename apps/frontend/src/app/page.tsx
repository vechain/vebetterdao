"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../components/MotionVStack"
import AnalyticsUtils from "../utils/AnalyticsUtils/AnalyticsUtils"
const HomePageContent = dynamic(() => import("@/app/components/HomepageContent").then(mod => mod.HomePageContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" gap={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})
export default function Home() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Home")
  }, [])
  return (
    <MotionVStack>
      <HomePageContent />
    </MotionVStack>
  )
}
