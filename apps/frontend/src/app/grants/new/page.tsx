"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"
import { useMetProposalCriteria } from "@/api/contracts/governance"
import { ProposalType } from "@/types"
import { useRouter } from "next/navigation"

const GrantsNewPageContent = dynamic(
  () => import("./components/GrantsNewPageContent").then(mod => mod.GrantsNewPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function GrantsNew() {
  const { hasMetProposalCriteria, isLoading } = useMetProposalCriteria(ProposalType.GRANT)
  const router = useRouter()
  useEffect(() => {
    AnalyticsUtils.trackPage(`Grants New`)
  }, [])

  useEffect(() => {
    if (!hasMetProposalCriteria && !isLoading) {
      router.push("/grants")
    }
  }, [hasMetProposalCriteria, isLoading, router])

  if (isLoading) {
    return (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    )
  }

  return (
    <MotionVStack>
      <GrantsNewPageContent />
    </MotionVStack>
  )
}
