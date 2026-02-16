"use client"
import { Button, Card, CloseButton, Dialog, Heading, List, Portal, Text, VStack } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const CreateProposalCTA = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { open } = useWalletModal()

  const handleClick = useCallback(() => {
    if (!account?.address) {
      open()
    }
  }, [account?.address, open])

  return (
    <Card.Root w="full" bg="bg.panel" borderColor="border.primary">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <VStack align="start" gap={1}>
            <Heading size="lg" fontWeight="bold">
              {t("Propose a Green Initiative")}
            </Heading>
            <Text textStyle="sm" color="text.muted">
              {t("Create a proposal to use treasury funds for environmental projects and green technology.")}
            </Text>
          </VStack>

          {account?.address ? (
            <Button variant="primary" asChild>
              <NextLink href="/proposals/new">{t("Create proposal")}</NextLink>
            </Button>
          ) : (
            <Button variant="primary" onClick={handleClick}>
              {t("Connect Wallet to Propose")}
            </Button>
          )}

          <TreasuryInfoDialog />
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

const TreasuryInfoDialog = () => {
  const { t } = useTranslation()

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm">
          {t("Learn more about the treasury")}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
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
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">{t("Close")}</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
