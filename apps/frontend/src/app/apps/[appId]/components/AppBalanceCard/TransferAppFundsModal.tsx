import { Button, VStack, useDisclosure, Text, Alert, Box, Card } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { XApp, UnendorsedApp } from "../../../../../api/contracts/xApps/getXApps"
import { BaseModal } from "../../../../../components/BaseModal"

import { DepositModal } from "./DepositModal"
import { FundsManagementModal } from "./FundsManagementModal"
import { WithdrawModal } from "./WithdrawModal"

type Props = {
  app: XApp | UnendorsedApp
  isOpen: boolean
  onClose: () => void
  isEnablingRewardsPool?: boolean
  isPaused?: boolean
  isAppAdmin?: boolean
  isTreasuryAddress?: boolean
}
export const TransferAppFundsModal = ({ app, isOpen, onClose, isEnablingRewardsPool, isPaused, isAppAdmin }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { open: isOpenWithdraw, onOpen: onOpenWithdraw, onClose: onCloseWithdraw } = useDisclosure()
  const { open: isOpenDeposit, onOpen: onOpenDeposit, onClose: onCloseDeposit } = useDisclosure()
  const {
    open: isOpenFundsManagement,
    onOpen: onOpenFundsManagement,
    onClose: onCloseFundsManagement,
  } = useDisclosure()
  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        showCloseButton={true}
        modalContentProps={{
          borderRadius: "2xl",
          maxW: "600px",
          w: "lg",
          p: 6,
        }}
        modalBodyProps={{
          p: 0,
        }}
        modalProps={{
          closeOnInteractOutside: true,
        }}>
        <VStack gap={6} w="full">
          <Text textStyle={{ base: "lg", md: "2xl" }} fontWeight="bold" alignSelf={"flex-start"}>
            {t("Transfer App Balance")}
          </Text>
          <VStack gap={4} w="full">
            {isPaused && (
              <Alert.Root status="error" borderRadius={["xl", "xl", "3xl"]}>
                <Alert.Indicator w={5} h={5} />
                <Box textStyle="sm">
                  <Alert.Description as="span">
                    {t(
                      "The rewards distribution is paused. You can still transfer funds from the rewards pool to your app balance, or withdraw your app balance.",
                    )}
                  </Alert.Description>
                </Box>
              </Alert.Root>
            )}
            <Card.Root variant="primary" w="full" rounded="16px" p={4}>
              <Card.Body p={0}>
                <VStack align="start" gap={4}>
                  <Text textStyle="lg" fontWeight="semibold">
                    {t("Withdraw")}
                  </Text>
                  <Text textStyle="sm">
                    {t("Send your app's funds received from allocations to your team wallet address.")}
                  </Text>
                  <Button
                    mt={1}
                    disabled={!isAppAdmin}
                    onClick={() => {
                      onOpenWithdraw()
                      onClose()
                    }}
                    variant={"primary"}
                    borderRadius={"full"}
                    w={"full"}>
                    {t("Withdraw")}
                  </Button>
                </VStack>
              </Card.Body>
            </Card.Root>
            <Card.Root variant="primary" w="full" rounded="16px" p={4}>
              <Card.Body p={0}>
                <VStack align="start" gap={4}>
                  <Text textStyle="lg" fontWeight="semibold">
                    {t("Deposit")}
                  </Text>
                  <Text textStyle="sm">
                    {t(
                      "Send B3TR tokens from the connected account to the app, and use them for rewards distribution.",
                    )}
                  </Text>
                  <Button
                    variant="primary"
                    mt={1}
                    onClick={() => {
                      onOpenDeposit()
                      onClose()
                    }}
                    w={"full"}>
                    {t("Deposit")}
                  </Button>
                </VStack>
              </Card.Body>
            </Card.Root>
            <Card.Root variant="primary" w="full" rounded="16px" p={4}>
              <Card.Body p={0}>
                <VStack align="start" gap={4}>
                  <Text textStyle="lg" fontWeight="semibold">
                    {t("Refill Pools")}
                  </Text>
                  <Text textStyle="sm">
                    {t(
                      "Refill B3TR to the Rewards Pool to distribute rewards, or move them back to the app balance when needed.",
                    )}
                  </Text>
                  <Button
                    mt={1}
                    disabled={!isAppAdmin}
                    onClick={() => {
                      onOpenFundsManagement()
                      onClose()
                    }}
                    variant={"primary"}
                    borderRadius={"full"}
                    w={"full"}>
                    {t("Refill Pools")}
                  </Button>
                </VStack>
              </Card.Body>
            </Card.Root>
          </VStack>
        </VStack>
      </BaseModal>

      <DepositModal appId={app?.id} isOpen={isOpenDeposit} onClose={onCloseDeposit} />
      <WithdrawModal
        appId={app?.id}
        teamWalletAddress={app?.teamWalletAddress ?? ""}
        isOpen={isOpenWithdraw}
        onClose={onCloseWithdraw}
      />
      <FundsManagementModal
        appId={app.id}
        isOpen={isOpenFundsManagement && !isTxModalOpen}
        onClose={onCloseFundsManagement}
        isEnablingRewardsPool={isEnablingRewardsPool}
        isRefillingPools={true}
      />
    </>
  )
}
