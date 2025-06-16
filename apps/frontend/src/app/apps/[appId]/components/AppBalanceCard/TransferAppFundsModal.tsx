import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  useDisclosure,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  Box,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { WithdrawModal } from "./WithdrawModal"
import { DepositModal } from "./DepositModal"
import { FundsManagementModal } from "./FundsManagementModal"

import { XApp, UnendorsedApp } from "@/api/contracts/xApps"

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

  const { isOpen: isOpenWithdraw, onOpen: onOpenWithdraw, onClose: onCloseWithdraw } = useDisclosure()
  const { isOpen: isOpenDeposit, onOpen: onOpenDeposit, onClose: onCloseDeposit } = useDisclosure()
  const {
    isOpen: isOpenFundsManagement,
    onOpen: onOpenFundsManagement,
    onClose: onCloseFundsManagement,
  } = useDisclosure()

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered={true} size={"xl"}>
        <ModalOverlay />
        <ModalContent borderRadius="20px">
          <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />
          <ModalHeader>
            <Text fontSize={{ base: 18, md: 24 }} fontWeight={700} alignSelf={"center"}>
              {t("Transfer App Balance")}
            </Text>
          </ModalHeader>
          <ModalBody pb={6}>
            <VStack justifyContent={"space-between"}>
              {isPaused && (
                <Alert status="error" borderRadius={["xl", "xl", "3xl"]}>
                  <AlertIcon w={5} h={5} />
                  <Box lineHeight={"1.20rem"} fontSize="sm">
                    <AlertDescription as="span">
                      {t(
                        "The rewards distribution is paused. You can still transfer funds from the rewards pool to your app balance, or withdraw your app balance.",
                      )}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
              <VStack
                align="start"
                spacing={4}
                border="1px solid #D5D5D5"
                borderRadius="20px"
                p="16px"
                justifyContent="space-between">
                <Text fontSize={18} fontWeight={600}>
                  {t("Withdraw")}
                </Text>
                <Text fontSize={14}>
                  {t("Send your app’s funds received from allocations to your team wallet address.")}
                </Text>
                <Button
                  mt={1}
                  isDisabled={!isAppAdmin}
                  onClick={() => {
                    onOpenWithdraw()
                    onClose()
                  }}
                  variant={"primaryAction"}
                  borderRadius={"full"}
                  w={"200px"}>
                  {t("Withdraw")}
                </Button>
              </VStack>
              <VStack
                align="start"
                spacing={4}
                border="1px solid #D5D5D5"
                borderRadius="20px"
                p="16px"
                justifyContent="space-between">
                <Text fontSize={18} fontWeight={600}>
                  {t("Deposit")}
                </Text>
                <Text fontSize={14}>
                  {t("Send B3TR tokens from the connected account to the app, and use them for rewards distribution.")}
                </Text>
                <Button
                  mt={1}
                  onClick={() => {
                    onOpenDeposit()
                    onClose()
                  }}
                  variant={"primarySubtle"}
                  borderRadius={"full"}
                  w={"200px"}>
                  {t("Deposit")}
                </Button>
              </VStack>
              <VStack
                align="start"
                spacing={4}
                borderRadius="20px"
                p="16px"
                border={"1px solid #D5D5D5"}
                boxShadow={"none"}
                justifyContent="space-between">
                <Text fontSize={18} fontWeight={600}>
                  {t("Refill Pools")}
                </Text>
                <Text fontSize={14}>
                  {t(
                    "Refill B3TR to the Rewards Pool to distribute rewards, or move them back to the app balance when needed.",
                  )}
                </Text>
                <Button
                  mt={1}
                  isDisabled={!isAppAdmin}
                  onClick={() => {
                    onOpenFundsManagement()
                    onClose()
                  }}
                  variant={"primaryAction"}
                  borderRadius={"full"}
                  w={"200px"}>
                  {t("Refill Pools")}
                </Button>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <DepositModal appId={app?.id} isOpen={isOpenDeposit} onClose={onCloseDeposit} />
      <WithdrawModal
        appId={app?.id}
        teamWalletAddress={app?.teamWalletAddress}
        isOpen={isOpenWithdraw}
        onClose={onCloseWithdraw}
      />
      <FundsManagementModal
        appId={app.id}
        isOpen={isOpenFundsManagement}
        onClose={onCloseFundsManagement}
        isEnablingRewardsPool={isEnablingRewardsPool}
        isRefillingPools={true}
      />
    </>
  )
}
