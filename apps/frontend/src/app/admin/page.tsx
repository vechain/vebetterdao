"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"

import { MotionVStack } from "../../components/MotionVStack"
const AdminPageContent = dynamic(() => import("./AdminPageContent").then(mod => mod.AdminPageContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" gap={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})
export default function AdminPage() {
  return (
    <MotionVStack>
      <AdminPageContent />
    </MotionVStack>
  )
}
