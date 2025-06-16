"use client"

import { MotionVStack } from "@/components"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const AppealSteps = dynamic(() => import("./AppealSteps").then(mod => mod.AppealSteps), {
  ssr: false,
  loading: () => (
    <VStack w="full" spacing={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})

export default function AppealPage() {
  return (
    <MotionVStack>
      <AppealSteps />
    </MotionVStack>
  )
}
