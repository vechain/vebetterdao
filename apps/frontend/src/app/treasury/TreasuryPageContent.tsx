"use client"
import { Grid, Heading, HStack, Icon, IconButton, Link, List, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { getConfig } from "@repo/config"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FiExternalLink } from "react-icons/fi"

import { AddressButton } from "@/components/AddressButton"
import { Modal } from "@/components/Modal"
import { getExplorerAddressLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import { useBreakpoints } from "../../hooks/useBreakpoints"

import { TreasuryBalanceChart } from "./components/TreasuryBalanceChart"
import { TreasuryOverview } from "./components/TreasuryOverview"
import { TreasuryTransfersList } from "./components/TreasuryTransfersList"

export const TreasuryPageContent = () => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const [isInfoOpen, setIsInfoOpen] = useState(false)

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

        <Grid templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 1fr) minmax(0, 1fr)" }} gap={8} w="full">
          <TreasuryOverview />
          <TreasuryBalanceChart />
        </Grid>
      </VStack>

      <TreasuryTransfersList />

      <TreasuryInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </VStack>
  )
}

const TreasuryInfoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("About the Treasury")} showCloseButton>
      <VStack align="stretch" gap={4}>
        <VStack align="start" gap={1}>
          <Text fontWeight="semibold">{t("What is the Treasury?")}</Text>
          <Text textStyle="sm" color="text.muted">
            {t(
              "The VeBetterDAO Treasury is a community-owned fund that holds B3TR tokens and other assets. It is governed by the community through on-chain proposals and voting.",
            )}
          </Text>
        </VStack>

        <VStack align="start" gap={1}>
          <Text fontWeight="semibold">{t("Where do funds come from?")}</Text>
          <List.Root gap={1}>
            <List.Item>
              <Text textStyle="sm" color="text.muted">
                {t("Weekly B3TR emissions allocated to the treasury")}
              </Text>
            </List.Item>
            <List.Item>
              <Text textStyle="sm" color="text.muted">
                {t("Surplus from app voting allocation rounds")}
              </Text>
            </List.Item>
            <List.Item>
              <Text textStyle="sm" color="text.muted">
                {t("Users upgrading their Galaxy Membership NFTs")}
              </Text>
            </List.Item>
          </List.Root>
        </VStack>

        <VStack align="start" gap={1}>
          <Text fontWeight="semibold">{t("How can funds be used?")}</Text>
          <Text textStyle="sm" color="text.muted">
            {t(
              "Any community member can submit a governance proposal to transfer funds from the treasury. Proposals require community approval through voting before execution.",
            )}
          </Text>
        </VStack>
      </VStack>
    </Modal>
  )
}
