"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const GrantsClientFormLayoutContent = dynamic(
  () => import("./components/GrantsClientFormLayoutContent").then(mod => mod.GrantsClientFormLayoutContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

type Props = {
  children: React.ReactNode
}
export default function GrantsNewLayout({ children }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage("GrantsNew")
  }, [])

  return (
    <MotionVStack>
      <GrantsClientFormLayoutContent>{children}</GrantsClientFormLayoutContent>
    </MotionVStack>
  )
}
