"use client"

import { MotionVStack } from "@/components"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const AppealPageContent = dynamic(() => import("./AppealContent").then(mod => mod.AppealContent), {
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
      <AppealPageContent />
    </MotionVStack>
  )
}
