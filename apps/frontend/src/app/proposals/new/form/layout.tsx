"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../../../components/MotionVStack"
const ClientFormLayoutContent = dynamic(
  () => import("./components/ClientFormLayoutContent").then(mod => mod.ClientFormLayoutContent),
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
export default function FormProposalLayout({ children }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal/preview")
  }, [])
  return (
    <MotionVStack>
      <ClientFormLayoutContent>{children}</ClientFormLayoutContent>
    </MotionVStack>
  )
}
