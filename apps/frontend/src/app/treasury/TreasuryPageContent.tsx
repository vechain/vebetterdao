"use client"
import { Grid, Heading, HStack, Icon, IconButton, Link, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { getConfig } from "@repo/config"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiExternalLink } from "react-icons/fi"

import { AddressButton } from "@/components/AddressButton"
import { InfoStep, InfoStepsCard } from "@/components/InfoStepsCard"
import { getExplorerAddressLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import { useBreakpoints } from "../../hooks/useBreakpoints"

import { TreasuryBalanceChart } from "./components/TreasuryBalanceChart"
import { TreasuryOverview } from "./components/TreasuryOverview"
import { TreasuryTransfersList } from "./components/TreasuryTransfersList"

export const TreasuryPageContent = () => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const onClose = useCallback(() => setIsInfoOpen(false), [])

  const steps = useMemo<InfoStep[]>(
    () => [
      {
        key: "what",
        title: t("About the Treasury"),
        image: "/assets/mascot/mascot-holding-tokens.webp",
        heading: t("What is the Treasury?"),
        listItems: [
          t(
            "The VeBetterDAO Treasury is a community-owned fund that holds B3TR tokens and other assets. It is governed by the community through on-chain proposals and voting.",
          ),
        ],
      },
      {
        key: "funds",
        title: t("About the Treasury"),
        image: "/assets/mascot/B3MO_Tokens_2.webp",
        heading: t("Where do funds come from?"),
        listItems: [
          t("Weekly B3TR emissions allocated to the treasury"),
          t("Surplus from app voting allocation rounds"),
          t("Users upgrading their Galaxy Membership NFTs"),
        ],
      },
      {
        key: "usage",
        title: t("About the Treasury"),
        image: "/assets/mascot/mascot-proposal.png",
        heading: t("How can funds be used?"),
        listItems: [
          t(
            "Any community member can submit a governance proposal to transfer funds from the treasury. Proposals require community approval through voting before execution.",
          ),
        ],
      },
    ],
    [t],
  )

  return (
    <VStack w="full" gap={8} pb={8} data-testid="treasury-page">
      <VStack justify="space-between" align="start" gap={8} w="full">
        <HStack justify="space-between" w="full" flexWrap="wrap" gap={3}>
          <HStack>
            <Heading size={{ base: "xl", md: "3xl" }}>{t("Treasury")}</Heading>
            <Link
              display="inline-flex"
              alignItems="center"
              fontWeight={500}
              color="primary.500"
              px={0}
              textStyle={{ base: "xs", lg: "md" }}
              onClick={() => setIsInfoOpen(true)}>
              <Icon as={UilInfoCircle} boxSize={4} />
              {!isMobile && t("More info")}
            </Link>
          </HStack>
          <HStack gap={2}>
            <AddressButton address={getConfig().treasuryContractAddress} size="sm" showAddressIcon={false} />
            <IconButton asChild aria-label="View on explorer" variant="outline" size="sm">
              <Link
                href={getExplorerAddressLink(getConfig().treasuryContractAddress)}
                target="_blank"
                rel="noopener noreferrer">
                <FiExternalLink />
              </Link>
            </IconButton>
          </HStack>
        </HStack>

        <InfoStepsCard steps={steps} isOpen={isInfoOpen} onClose={onClose} />

        <Grid templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 1fr) minmax(0, 1fr)" }} gap={8} w="full">
          <TreasuryOverview />
          <TreasuryBalanceChart />
        </Grid>
      </VStack>

      <TreasuryTransfersList />
    </VStack>
  )
}
