"use client"

import { MotionVStack } from "@/components"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const AdminPageContent = dynamic(() => import("./AdminPageContent").then(mod => mod.AdminPageContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" spacing={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})

export default function AdminPage() {
  return <MotionVStack children={<AdminPageContent />} />
}
