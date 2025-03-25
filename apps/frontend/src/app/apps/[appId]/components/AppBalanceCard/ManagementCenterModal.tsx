import {
  Heading,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  HStack,
  Text,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  VStack,
  useDisclosure,
  Icon,
  Box,
} from "@chakra-ui/react"
import { useTranslation, Trans } from "react-i18next"
import { useCallback, useState, useMemo } from "react"
import { TransactionModal, ExclamationTriangle, TransactionModalStatus } from "@/components"
import {
  useIsRewardsPoolEnabled,
  useDistributionManagement,
  useIsDistributionPaused,
} from "@/api/contracts/x2EarnRewardsPool"
import { FaArrowLeft } from "react-icons/fa"

export type Props = {
  appId: string
  isOpen: boolean
  onClose: () => void
  b3trAppBalance?: string
}

export const ManagementCenterModal = ({ appId, isOpen, onClose, b3trAppBalance }: Props) => {
  const { t } = useTranslation()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [actionToConfirm, setActionToConfirm] = useState<"enable" | "disable" | "pause" | "resume">()

  // Get the initial state from the hook
  const { data: isEnabled } = useIsRewardsPoolEnabled(appId)
  const { data: isPaused } = useIsDistributionPaused(appId)

  const {
    isOpen: isTransactionModalOpen,
    onOpen: onOpenTransactionModal,
    onClose: onCloseTransactionModal,
  } = useDisclosure()

  // Pause, resume and toggle hooks
  const { pauseDistribution, unpauseDistribution, toggleRewardsPool } = useDistributionManagement({
    xAppId: appId,
    isEnabled: isEnabled === undefined ? false : !isEnabled,
    onSuccess: () => {
      onCloseTransactionModal()
      managementAction.resetStatus()
      setShowConfirmation(false)
    },
  })

  const managementAction = useMemo(() => {
    if (actionToConfirm === "enable" || actionToConfirm === "disable") {
      return toggleRewardsPool
    }

    if (actionToConfirm === "pause") {
      return pauseDistribution
    } else {
      return unpauseDistribution
    }
  }, [actionToConfirm, toggleRewardsPool, pauseDistribution, unpauseDistribution])

  const handleManagementAction = () => {
    managementAction.sendTransaction(undefined)
    onOpenTransactionModal()
  }

  // Modal management
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleCloseTransactionModal = useCallback(() => {
    managementAction.resetStatus()
    onCloseTransactionModal()
  }, [onCloseTransactionModal, managementAction])

  const handleShowConfirmation = (action: "enable" | "disable" | "pause" | "resume") => {
    setActionToConfirm(action)
    setShowConfirmation(true)
  }

  const handleGoBack = useCallback(() => {
    setShowConfirmation(false)
  }, [])

  const pendingTitle = useMemo(() => {
    switch (actionToConfirm) {
      case "enable":
        return !isEnabled ? t("Enabling rewards pool...") : t("Disabling rewards pool...")
      case "pause":
        return t("Pausing distribution...")
      case "resume":
        return t("Resuming distribution...")
    }
  }, [actionToConfirm, isEnabled, t])

  const errorTitle = useMemo(() => {
    switch (actionToConfirm) {
      case "enable":
        return t("Error enabling rewards pool")
      case "disable":
        return t("Error disabling rewards pool")
      case "pause":
        return t("Error pausing distribution")
      case "resume":
        return t("Error resuming distribution")
    }
  }, [actionToConfirm, t])

  const successTitle: string = useMemo(() => {
    switch (actionToConfirm) {
      case "enable":
        return t("Enable Rewards Pool")
      case "disable":
        return t("Disable Rewards Pool")
      case "pause":
        return t("Pause Distribution")
      case "resume":
        return t("Resume Distribution")
      default:
        return ""
    }
  }, [actionToConfirm, t])

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} isCentered={true} size={"xl"}>
        <ModalOverlay />
        <ModalContent borderRadius="20px">
          <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />

          {!showConfirmation ? (
            <>
              <ModalHeader top={{ base: 5, md: 6 }}>
                <Text fontSize={{ base: 18, md: 24 }} fontWeight={700} alignSelf={"center"}>
                  {t("Manage distribution")}
                </Text>
              </ModalHeader>
              <ModalBody pb={6}>
                {!isPaused && (
                  <VStack
                    align="start"
                    spacing={4}
                    border="1px solid #D5D5D5"
                    borderRadius="20px"
                    p="16px"
                    color="#252525"
                    justifyContent="space-between">
                    <HStack spacing={2}>
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg={isEnabled ? "#3DBA67" : "#C84968"}
                        boxShadow={isEnabled ? "0 0 8px rgba(72, 187, 120, 0.5)" : "0 0 8px rgba(245, 101, 101, 0.5)"}
                      />
                      <Text fontSize={18} fontWeight={600}>
                        {t("Rewards Pool")}
                      </Text>
                    </HStack>
                    {!isEnabled ? (
                      <>
                        <Text fontSize={14}>
                          <Trans
                            i18nKey="The rewards pool holds B3TR used to reward user actions. When you enable it, <bold>the pool starts empty</bold>, remember to <bold>fill it with funds</bold> to distribute rewards."
                            components={{ bold: <Text as="span" fontWeight={"600"} /> }}
                          />
                        </Text>
                        <Button
                          variant="primaryAction"
                          borderRadius="full"
                          w="200px"
                          onClick={() => handleShowConfirmation("enable")}>
                          {t("Enable")}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Text fontSize={14}>
                          <Trans
                            i18nKey="When you disabled rewards pool, <bold>the funds will move to app balance</bold>, you can enable it back at any time. The distributor will <bold>stop distributing rewards</bold> from the app balance pool."
                            components={{ bold: <Text as="span" fontWeight={"600"} /> }}
                          />
                        </Text>
                        <Button
                          variant="primaryAction"
                          borderRadius="full"
                          w="200px"
                          onClick={() => handleShowConfirmation("disable")}>
                          {t("Disable")}
                        </Button>
                      </>
                    )}
                  </VStack>
                )}
                <VStack
                  align="start"
                  spacing={4}
                  border={isPaused ? "1px solid #C84968" : "1px solid #D5D5D5"}
                  boxShadow={isPaused ? "0 0 8px rgba(245, 101, 101, 0.5)" : "none"}
                  borderRadius="20px"
                  p="16px"
                  mt={isPaused ? "0" : "24px"}
                  color="#252525"
                  justifyContent="space-between">
                  <HStack spacing={2}>
                    {isPaused && (
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg={"#C84968"}
                        boxShadow={"0 0 8px rgba(245, 101, 101, 0.5)"}
                      />
                    )}
                    <Text fontSize={18} fontWeight={600}>
                      {isPaused ? t("Resume Distribution") : t("Pause Distribution")}
                    </Text>
                  </HStack>
                  {isPaused ? (
                    <>
                      <Text fontSize={14}>
                        <Trans
                          i18nKey="<bold>Resume the distribution</bold> to distribute rewards again and set a rewards pool."
                          components={{ bold: <Text as="span" fontWeight={"600"} /> }}
                        />
                      </Text>
                      <Button
                        variant="dangerFilledTonal"
                        borderRadius="full"
                        color="#C84968"
                        w="200px"
                        colorScheme="red"
                        onClick={() => handleShowConfirmation("resume")}>
                        {t("Resume Distribution")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Text fontSize={14}>
                        <Trans
                          i18nKey="You can pause your app distribution. This will <bold>stop your distributor from distributing rewards</bold>. You can resume the distribution at any time. This action won't affect your app's pools."
                          components={{ bold: <Text as="span" fontWeight={"600"} /> }}
                        />
                      </Text>
                      <Button
                        variant="dangerFilledTonal"
                        borderRadius="full"
                        w="200px"
                        color="#C84968"
                        colorScheme="red"
                        onClick={() => handleShowConfirmation("pause")}>
                        {t("Pause Distribution")}
                      </Button>
                    </>
                  )}
                </VStack>
              </ModalBody>
            </>
          ) : (
            <>
              <ModalHeader top={{ base: 5, md: 6 }}>
                <HStack spacing={4}>
                  <Icon as={FaArrowLeft} onClick={handleGoBack} cursor="pointer" />

                  <Heading>
                    {actionToConfirm === "enable" && t("Enable Rewards Pool")}
                    {actionToConfirm === "disable" && t("Disable Rewards Pool")}
                    {actionToConfirm === "pause" && t("Pause Distribution")}
                    {actionToConfirm === "resume" && t("Resume Distribution")}
                  </Heading>
                </HStack>
              </ModalHeader>
              <ModalBody pb={6}>
                <VStack justifyContent="space-between">
                  <VStack border="1px solid #D5D5D5" borderRadius="20px" p="20px">
                    <ExclamationTriangle size={"100px"} />

                    <Text fontSize={16} fontWeight={600} color="#252525">
                      {actionToConfirm === "enable" && t("Are you sure you want to enable the rewards pool?")}
                      {actionToConfirm === "disable" && t("Are you sure you want to disable the rewards pool?")}
                      {actionToConfirm === "pause" && t("Are you sure you want to pause rewards distribution?")}
                      {actionToConfirm === "resume" && t("Are you sure you want to resume rewards distribution?")}
                    </Text>
                    <Text fontSize={14} fontWeight={400} color="#252525" textAlign={"center"} px={8}>
                      {actionToConfirm === "enable" &&
                        t(
                          "When you enable the rewards pool, it starts empty. You'll need to transfer B3TR to it before you can distribute rewards.",
                        )}
                      {actionToConfirm === "disable" &&
                        t(
                          "This will automatically move your rewards pool to your app balance. You can enable back the rewards pool at any time.",
                        )}
                      {actionToConfirm === "pause" &&
                        t("This will temporarily stop rewards distribution for your app until you resume it.")}
                      {actionToConfirm === "resume" &&
                        t(
                          "Your distributor will have access back to the rewards pool if you enabled it, and users will start receiving rewards for their actions again.",
                        )}
                    </Text>
                  </VStack>
                  <HStack mt={6} spacing={4} width="full">
                    <Button variant="primarySubtle" flex={1} onClick={handleGoBack}>
                      {t("Cancel")}
                    </Button>
                    <Button variant="primaryAction" flex={1} onClick={handleManagementAction}>
                      {t("Confirm")}
                    </Button>
                  </HStack>
                </VStack>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleCloseTransactionModal}
        status={managementAction?.status as TransactionModalStatus}
        txId={managementAction?.txReceipt?.meta.txID}
        errorDescription={managementAction?.error?.reason ?? "Unknown error"}
        showSocialButtons
        showExplorerButton
        onTryAgain={handleManagementAction}
        showTryAgainButton
        pendingTitle={pendingTitle}
        errorTitle={errorTitle}
        successTitle={successTitle}
        isEnablingRewardsPool={!isEnabled}
        b3trAmount={b3trAppBalance}
        b3trBalanceAfterSwap={"0"}
      />
    </>
  )
}
