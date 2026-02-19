"use client"

import { Box, Heading, HStack, Tag, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useXApps } from "../../../api/contracts/xApps/hooks/useXApps"
import { useGetUserNodes } from "../../../api/contracts/xNodes/useGetUserNodes"

import { AppsNeedEndorsementSidebar } from "./AppsNeedEndorsementSidebar"
import { EndorsementFaqCard } from "./EndorsementFaqCard"
import { NodeCard } from "./NodeCard"
import { NodesHeroStats } from "./NodesHeroStats"
import { StargateNodeCtaCard } from "./StargateNodeCtaCard"

export const NodesPageContent = () => {
  const { t } = useTranslation()
  const { data: userNodesInfo, isLoading: isNodesLoading } = useGetUserNodes()
  const { data: xApps } = useXApps({ filterBlacklisted: true })

  const nodes = useMemo(
    () =>
      [...(userNodesInfo?.nodesManagedByUser ?? [])].sort((a, b) =>
        a.endorsementScore > b.endorsementScore ? -1 : a.endorsementScore < b.endorsementScore ? 1 : 0,
      ),
    [userNodesInfo?.nodesManagedByUser],
  )

  if (isNodesLoading) return null

  return (
    <Box maxW="breakpoint-xl" mx="auto" w="full">
      <NodesHeroStats userNodesInfo={userNodesInfo} />
      <Box display="grid" gridTemplateColumns={{ base: "1fr", lg: "1fr 415px" }} gap={8} mt={8} alignItems="start">
        <VStack align="stretch" gap={6}>
          <HStack justify="space-between" align="center">
            <Heading textStyle="xl" size="xl">
              {t("Your active nodes")}
            </Heading>
            <Tag.Root size="sm" variant="subtle">
              <Tag.Label>
                {nodes.length} {nodes.length === 1 ? t("node") : t("nodes")}
              </Tag.Label>
            </Tag.Root>
          </HStack>
          {nodes.map(node => (
            <NodeCard key={node.id.toString()} node={node} />
          ))}
          <StargateNodeCtaCard />
        </VStack>

        <VStack align="stretch" gap={6}>
          <AppsNeedEndorsementSidebar apps={xApps?.allApps ?? []} />
          <EndorsementFaqCard />
        </VStack>
      </Box>
    </Box>
  )
}
