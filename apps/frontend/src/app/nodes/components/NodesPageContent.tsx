"use client"

import { Box, Heading, HStack, Icon, Link, Tag, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { InfoStep, InfoStepsCard } from "@/components/InfoStepsCard"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { useXApps } from "../../../api/contracts/xApps/hooks/useXApps"
import { useGetUserNodes } from "../../../api/contracts/xNodes/useGetUserNodes"

import { AppsNeedEndorsementSidebar } from "./AppsNeedEndorsementSidebar"
import { NodeCard } from "./NodeCard"
import { NodesHeroStats } from "./NodesHeroStats"
import { StargateNodeCtaCard } from "./StargateNodeCtaCard"

const NODES_STEPS_STORAGE_KEY = "NODES_STEPS_DISMISSED"

export const NodesPageContent = () => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const { data: userNodesInfo, isLoading: isNodesLoading } = useGetUserNodes()
  const { data: xApps } = useXApps({ filterBlacklisted: true })

  const nodes = useMemo(
    () =>
      [...(userNodesInfo?.nodesManagedByUser ?? [])].sort((a, b) =>
        a.endorsementScore > b.endorsementScore ? -1 : a.endorsementScore < b.endorsementScore ? 1 : 0,
      ),
    [userNodesInfo?.nodesManagedByUser],
  )

  const [stepsOpen, setStepsOpen] = useState<boolean | null>(null)
  const open = stepsOpen ?? false

  const onOpen = useCallback(() => setStepsOpen(true), [])
  const onClose = useCallback(() => {
    setStepsOpen(false)
    try {
      localStorage.setItem(NODES_STEPS_STORAGE_KEY, "true")
    } catch {
      // ignore quota / private mode
    }
  }, [])

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(NODES_STEPS_STORAGE_KEY) === "true"
    } catch {
      // ignore
    }
    setStepsOpen(!dismissed)
  }, [])

  const steps = useMemo<InfoStep[]>(
    () => [
      {
        key: "what",
        title: t("Nodes"),
        image: "/assets/3d-illustrations/node-hq.webp",
        heading: t("What are StarGate Nodes?"),
        listItems: [
          t(
            "StarGate Nodes are obtained by staking VET on the StarGate app. A user can hold multiple nodes, each with a different tier and endorsement score.",
          ),
          t(
            "Node holders play a key role in the ecosystem by endorsing apps and helping decide which ones participate in weekly allocation rounds.",
          ),
        ],
      },
      {
        key: "endorsement",
        title: t("Endorsement"),
        image: "/assets/3d-illustrations/voting-hq.webp",
        heading: t("How does endorsement work?"),
        listItems: [
          t(
            "An app needs to be endorsed to participate in weekly allocation rounds and receive B3TR rewards. An app is endorsed once it reaches 100 points.",
          ),
          t(
            "Each node type has a different endorsement score. A node can endorse multiple apps but with a maximum of 49 points per app. An app can receive a maximum of 110 points.",
          ),
        ],
      },
      {
        key: "rules",
        title: t("Rules & opportunities"),
        image: "/assets/3d-illustrations/hand-phone-hq.webp",
        heading: t("Cooldown, grace period & deals"),
        listItems: [
          t(
            "Once a node endorses an app, it must wait 1 round before removing its endorsement. If an app drops below 100 points it enters a 2-week grace period to recover.",
          ),
          t(
            "Node holders can negotiate deals with app owners — early access, dedicated features, revenue sharing, or other perks in exchange for endorsement.",
          ),
        ],
      },
    ],
    [t],
  )

  if (isNodesLoading) return null

  return (
    <Box maxW="breakpoint-xl" mx="auto" w="full">
      <VStack align="stretch" gap={8}>
        <HStack alignItems="center" w="full" justifyContent="flex-start">
          <Heading size={{ base: "2xl", lg: "3xl" }}>{t("Nodes and Endorsement")}</Heading>
          {!open && (
            <Link
              display="inline-flex"
              alignItems="center"
              fontWeight={500}
              color="primary.500"
              px={0}
              textStyle={{ base: "xs", lg: "md" }}
              onClick={onOpen}>
              <Icon as={UilInfoCircle} boxSize={4} />
              {!isMobile && t("More info")}
            </Link>
          )}
        </HStack>

        <InfoStepsCard steps={steps} isOpen={open} onClose={onClose} />

        <NodesHeroStats userNodesInfo={userNodesInfo} />
      </VStack>

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
        </VStack>
      </Box>
    </Box>
  )
}
