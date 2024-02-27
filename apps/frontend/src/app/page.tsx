"use client"

import { AnalyticsUtils } from "@/utils"
import { Skeleton, Spinner, Stack, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const HomePageContent = dynamic(() => import("@/components/HomepageContent").then(mod => mod.HomePageContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" spacing={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})
export default function Home() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Home")
  }, [])
  return (
    <VStack w="full" spacing={12}>
      <Stack
        direction={["column-reverse", "column-reverse", "row"]}
        w="full"
        justify="space-between"
        align={["stretch", "stretch", "flex-start"]}
        spacing={12}>
        <HomePageContent />
      </Stack>
    </VStack>
  )
}
