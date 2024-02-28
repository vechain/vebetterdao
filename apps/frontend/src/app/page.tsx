"use client"

import { AnalyticsUtils } from "@/utils"
import { Skeleton, Spinner, Stack, VStack } from "@chakra-ui/react"
import { motion } from "framer-motion"
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

const MotionVStack = motion(VStack)

export default function Home() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Home")
  }, [])
  return (
    <MotionVStack
      w="full"
      spacing={12}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 2,
        delay: 0.5,
        ease: [0, 0.71, 0.2, 1.01],
      }}>
      <Stack
        direction={["column-reverse", "column-reverse", "row"]}
        w="full"
        justify="space-between"
        align={["stretch", "stretch", "flex-start"]}
        spacing={12}>
        <HomePageContent />
      </Stack>
    </MotionVStack>
  )
}
