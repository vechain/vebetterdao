"use client"

import { Box, Heading, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useXApps } from "../../../api/contracts/xApps/hooks/useXApps"
import { useGetUserNodes } from "../../../api/contracts/xNodes/useGetUserNodes"

import { AppsNeedEndorsementSidebar } from "./AppsNeedEndorsementSidebar"
import { NodeCard } from "./NodeCard"
import { NodesHeroStats } from "./NodesHeroStats"
import { NoNodesEmptyState } from "./NoNodesEmptyState"

export const NodesPageContent = () => {
  const { t } = useTranslation()
  const { data: userNodesInfo, isLoading: isNodesLoading } = useGetUserNodes()
  const { data: xApps } = useXApps()

  if (isNodesLoading) return null

  const nodes = userNodesInfo?.nodesManagedByUser ?? []
  const hasNodes = nodes.length > 0

  if (!hasNodes) {
    return (
      <Box maxW="breakpoint-xl" mx="auto" w="full" px={{ base: 4, md: 6 }}>
        <NoNodesEmptyState />
      </Box>
    )
  }

  return (
    <Box maxW="breakpoint-xl" mx="auto" w="full" px={{ base: 4, md: 6 }}>
      <NodesHeroStats userNodesInfo={userNodesInfo!} />
      <Box display="grid" gridTemplateColumns={{ base: "1fr", lg: "1fr 415px" }} gap={8} mt={8} alignItems="start">
        <VStack align="stretch" gap={6}>
          <Heading textStyle="xl" size="xl">
            {(t as (k: string) => string)("Your active nodes")}
          </Heading>
          {nodes.map(node => (
            <NodeCard key={node.id.toString()} node={node} />
          ))}
        </VStack>
        <AppsNeedEndorsementSidebar
          gracePeriodApps={xApps?.gracePeriod ?? []}
          endorsementLostApps={xApps?.endorsementLost ?? []}
          newLookingForEndorsement={xApps?.newLookingForEndorsement ?? []}
        />
      </Box>
    </Box>
  )
}
