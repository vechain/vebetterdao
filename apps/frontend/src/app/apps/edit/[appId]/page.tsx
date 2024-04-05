"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const EditAppPageContent = dynamic(
  () => import("./components/EditAppPageContent").then(mod => mod.EditAppPageContent),
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

export default function EditAppPage({ params }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage(`apps/edit/${params.appId}`)
  }, [])

  return (
    <MotionVStack>
      <EditAppPageContent appId={params.appId} />
    </MotionVStack>
  )
}
