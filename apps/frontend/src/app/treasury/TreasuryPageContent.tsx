"use client"
import { CloseButton, Dialog, Grid, Heading, HStack, Icon, Link, List, Portal, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

import { useBreakpoints } from "../../hooks/useBreakpoints"

import { TreasuryBalanceChart } from "./components/TreasuryBalanceChart"
import { TreasuryOverview } from "./components/TreasuryOverview"
import { TreasuryTransfersList } from "./components/TreasuryTransfersList"

export const TreasuryPageContent = () => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  return (
    <VStack w="full" gap={8} pb={8} data-testid="treasury-page">
      <VStack justify="space-between" align="start" gap={8} w="full">
        <HStack>
          <Heading size={{ base: "xl", md: "3xl" }}>{t("Treasury")}</Heading>
          <TreasuryInfoDialog isMobile={isMobile} />
        </HStack>
        <TreasuryOverview />
      </VStack>

      <Grid templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(0, 1fr)" }} gap={8} w="full">
        <VStack gap={8} align="stretch">
          <TreasuryBalanceChart />
        </VStack>

        <VStack gap={8} align="stretch" position={{ base: "static", lg: "static" }} top={24} alignSelf="start">
          <TreasuryTransfersList />
        </VStack>
      </Grid>
    </VStack>
  )
}

const TreasuryInfoDialog = ({ isMobile }: { isMobile: boolean }) => {
  const { t } = useTranslation()

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Link
          display="inline-flex"
          alignItems="center"
          fontWeight={500}
          color="primary.500"
          px={0}
          textStyle={{ base: "xs", lg: "md" }}>
          <Icon as={UilInfoCircle} boxSize={4} />
          {!isMobile && t("More info")}
        </Link>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content gap={4}>
            <Dialog.Header>
              <Dialog.Title>{t("About the Treasury")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
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
            </Dialog.Body>
            <Dialog.Footer></Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
