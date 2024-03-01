"use client"

import { AnalyticsUtils } from "@/utils"
import { Spinner, Stack, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"
import { motion } from "framer-motion"

const AllocationRoundContent = dynamic(
  () => import("./AllocationRoundContent").then(mod => mod.AllocationRoundContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
type Props = {
  params: {
    roundId: string
  }
}

export default function round({ params }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage(`Round/${params.roundId}`)
  }, [])

  const MotionVStack = motion(VStack)

  return (
    <MotionVStack
      w="full"
      spacing={12}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 1,
        delay: 0.5,
        ease: [0, 0.71, 0.2, 1.01],
      }}>
      <Stack
        direction={["column-reverse", "column-reverse", "row"]}
        w="full"
        justify="space-between"
        align={["stretch", "stretch", "flex-start"]}
        spacing={12}>
        <AllocationRoundContent params={params} />
      </Stack>
    </MotionVStack>
  )
}
