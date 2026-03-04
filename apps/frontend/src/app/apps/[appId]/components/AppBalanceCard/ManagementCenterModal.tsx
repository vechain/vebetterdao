import { HStack, Text, Button, VStack, Box, Card } from "@chakra-ui/react"
import { useCallback, useState, useMemo } from "react"
import { useTranslation, Trans } from "react-i18next"

import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { useIsDistributionPaused } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useIsDistributionPaused"
import { useIsRewardsPoolEnabled } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useIsRewardsPoolEnabled"
import { useDistributionManagement } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/setter/useDistributionManagement"
import { ExclamationTriangle } from "../../../../../components/Icons/ExclamationTriangle"
import { StepModal, type Step } from "../../../../../components/StepModal/StepModal"

export type Props = {
  appId: string
  isOpen: boolean
  onClose: () => void
  b3trAppBalance?: string
}
enum ManagementStep {
  MANAGEMENT_OPTIONS = "MANAGEMENT_OPTIONS",
  CONFIRMATION = "CONFIRMATION",
}
const STEP_COUNT = Object.keys(ManagementStep).length
export const ManagementCenterModal = ({ appId, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const [actionToConfirm, setActionToConfirm] = useState<"enable" | "disable" | "pause" | "resume">()
  // Get the initial state from the hook
  const { data: isEnabled } = useIsRewardsPoolEnabled(appId)
  const { data: isPaused } = useIsDistributionPaused(appId)
  const { isTxModalOpen } = useTransactionModal()
  const [step, setStep] = useState(0)
  const handleClose = useCallback(() => {
    setStep(0)
    onClose()
  }, [onClose])

  const goToNext = useCallback(() => {
    const nextStep = step + 1
    if (nextStep >= STEP_COUNT) handleClose()
    else setStep(nextStep)
  }, [step, handleClose])

  const goToPrevious = useCallback(() => {
    const prevStep = step - 1
    if (prevStep < 0) handleClose()
    else setStep(prevStep)
  }, [step, handleClose])

  // Pause, resume and toggle hooks
  const { pauseDistribution, unpauseDistribution, toggleRewardsPool } = useDistributionManagement({
    xAppId: appId,
    isEnabled: isEnabled === undefined ? false : !isEnabled,
    onSuccess: handleClose,
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

  const handleManagementAction = useCallback(() => {
    managementAction.sendTransaction()
  }, [managementAction])

  // Modal management
  const handleShowConfirmation = useCallback(
    (action: "enable" | "disable" | "pause" | "resume") => {
      setActionToConfirm(action)
      goToNext()
    },
    [goToNext],
  )

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

  const confirmationText = useMemo(() => {
    switch (actionToConfirm) {
      case "enable":
        return t("Are you sure you want to enable the rewards pool?")
      case "disable":
        return t("Are you sure you want to disable the rewards pool?")
      case "pause":
        return t("Are you sure you want to pause rewards distribution?")
      case "resume":
        return t("Are you sure you want to resume rewards distribution?")
    }
  }, [actionToConfirm, t])

  const informationOnConfirmationText = useMemo(() => {
    switch (actionToConfirm) {
      case "enable":
        return t(
          "The pool will start empty. Use Re-balance to move B3TR from your app balance into the pool before distributing rewards.",
        )
      case "disable":
        return t(
          "All funds in the rewards pool will be moved back to your app balance. You can re-enable the pool at any time.",
        )
      case "pause":
        return t("Rewards distribution will stop until you resume it. Your pool funds will remain untouched.")
      case "resume":
        return t("Your distributor will be able to send rewards again. Make sure the rewards pool has enough funds.")
    }
  }, [actionToConfirm, t])

  const ManagementOptionsContent = useMemo(
    () => (
      <VStack gap={4}>
        {!isPaused && (
          <Card.Root variant="primary" w="full" rounded="16px" p={4}>
            <Card.Body p={0}>
              <VStack align="start" gap={4}>
                <HStack gap={2}>
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={isEnabled ? "status.positive.primary" : "status.negative.primary"}
                    boxShadow={
                      isEnabled
                        ? "0 0 8px token(colors.status.positive.primary/50)"
                        : "0 0 8px token(colors.status.negative.primary/50)"
                    }
                  />
                  <Text textStyle="lg" fontWeight="semibold">
                    {isEnabled ? t("Rewards Pool Active") : t("Rewards Pool Inactive")}
                  </Text>
                </HStack>
                {!isEnabled ? (
                  <>
                    <Text textStyle="sm">
                      <Trans
                        i18nKey="The rewards pool is where B3TR is held for distributing rewards to users. When enabled, <bold>it starts empty</bold> — you'll need to <bold>move funds from your balance</bold> using Re-balance."
                        components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                      />
                    </Text>
                    <Button
                      variant="primary"
                      borderRadius="full"
                      w="full"
                      onClick={() => handleShowConfirmation("enable")}>
                      {t("Enable")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Text textStyle="sm">
                      <Trans
                        i18nKey="Disabling the pool will <bold>move all remaining funds back to your app balance</bold>. Your distributor will <bold>no longer be able to send rewards</bold>. You can re-enable it at any time."
                        components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                      />
                    </Text>
                    <Button
                      variant="primary"
                      borderRadius="full"
                      w="full"
                      onClick={() => handleShowConfirmation("disable")}>
                      {t("Disable")}
                    </Button>
                  </>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
        <Card.Root
          variant="primary"
          w="full"
          rounded="16px"
          p={4}
          border={isPaused ? "1px solid token(colors.status.negative.primary)" : undefined}
          boxShadow={isPaused ? "0 0 8px token(colors.status.negative.primary/50)" : "none"}>
          <Card.Body p={0}>
            <VStack align="start" gap={4}>
              <HStack gap={2}>
                {isPaused && (
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg="status.negative.primary"
                    boxShadow="0 0 8px token(colors.status.negative.primary/50)"
                  />
                )}
                <Text textStyle="lg" fontWeight="semibold">
                  {isPaused ? t("Resume Distribution") : t("Pause Distribution")}
                </Text>
              </HStack>
              {isPaused ? (
                <>
                  <Text textStyle="sm">
                    <Trans
                      i18nKey="<bold>Resume distribution</bold> so your app can start rewarding users again. Make sure the rewards pool has funds available."
                      components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                    />
                  </Text>
                  <Button
                    colorPalette="red"
                    borderRadius="full"
                    w="full"
                    onClick={() => handleShowConfirmation("resume")}>
                    {t("Resume Distribution")}
                  </Button>
                </>
              ) : (
                <>
                  <Text textStyle="sm">
                    <Trans
                      i18nKey="Temporarily <bold>stop your app from distributing rewards</bold>. Your funds stay in the pool and you can resume at any time."
                      components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                    />
                  </Text>
                  <Button w="full" colorPalette="red" onClick={() => handleShowConfirmation("pause")}>
                    {t("Pause Distribution")}
                  </Button>
                </>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    ),
    [t, isPaused, isEnabled, handleShowConfirmation],
  )

  const ConfirmationContent = useMemo(
    () => (
      <VStack gap={4}>
        <Card.Root variant="primary" w="full" rounded="16px" p={4}>
          <Card.Body p={0}>
            <VStack gap={4}>
              <ExclamationTriangle size={"100px"} />

              <Text textStyle="md" fontWeight="semibold">
                {confirmationText}
              </Text>
              <Text textStyle="sm" textAlign={"center"} px={8}>
                {informationOnConfirmationText}
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
        <HStack gap={4} width="full">
          <Button variant="ghost" color="status.negative.primary" flex={1} onClick={goToPrevious}>
            {t("Cancel")}
          </Button>
          <Button variant="primary" flex={1} onClick={handleManagementAction}>
            {t("Confirm")}
          </Button>
        </HStack>
      </VStack>
    ),
    [goToPrevious, confirmationText, informationOnConfirmationText, t, handleManagementAction],
  )

  const steps = useMemo<Step<ManagementStep>[]>(
    () => [
      {
        key: ManagementStep.MANAGEMENT_OPTIONS,
        content: ManagementOptionsContent,
        title: t("Distribution Settings"),
      },
      {
        key: ManagementStep.CONFIRMATION,
        content: ConfirmationContent,
        title: successTitle,
      },
    ],
    [ManagementOptionsContent, ConfirmationContent, t, successTitle],
  )

  return (
    <StepModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={handleClose}
      goToPrevious={goToPrevious}
      goToNext={goToNext}
      setActiveStep={setStep}
      steps={steps}
      activeStep={step}
      closeOnInteractOutside={true}
      modalContentProps={{
        borderRadius: "2xl",
        maxW: "600px",
        w: "lg",
      }}
    />
  )
}
