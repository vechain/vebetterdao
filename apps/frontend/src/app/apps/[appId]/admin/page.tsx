"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const AdminAppPageContent = dynamic(
  () => import("./components/AdminAppPageContent").then(mod => mod.AdminAppPageContent),
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
    appId: string
  }
}

export default function AppAdmin({ params }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage(`App/${params.appId}`)
  }, [params.appId])

  return (
    <MotionVStack w="full">
      <AdminAppPageContent />
    </MotionVStack>
  )
}
