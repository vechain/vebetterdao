import { HStack, Text, Button, VStack, Box } from "@chakra-ui/react"
import { useCallback, useState, useMemo } from "react"
import { useTranslation, Trans } from "react-i18next"

import { useIsDistributionPaused } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useIsDistributionPaused"
import { useIsRewardsPoolEnabled } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useIsRewardsPoolEnabled"
import { useDistributionManagement } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/setter/useDistributionManagement"
import { ExclamationTriangle } from "../../../../../components/Icons/ExclamationTriangle"
import { StepModal, type Step } from "../../../../../components/StepModal/StepModal"

import { useTransactionModal } from "@/providers/TransactionModalProvider"

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
  const goToNext = useCallback(() => {
    const nextStep = step + 1
    if (nextStep > STEP_COUNT) onClose()
    else setStep(nextStep)
  }, [step, onClose])
  const goToPrevious = useCallback(() => {
    const prevStep = step - 1
    if (prevStep < 1) onClose()
    else setStep(prevStep)
  }, [step, onClose])
  const handleClose = useCallback(() => {
    setStep(0)
    onClose()
  }, [onClose, setStep])

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
          "When you enable the rewards pool, it starts empty. You'll need to transfer B3TR to it before you can distribute rewards.",
        )
      case "disable":
        return t(
          "This will automatically move your rewards pool to your app balance. You can enable back the rewards pool at any time.",
        )
      case "pause":
        return t("This will temporarily stop rewards distribution for your app until you resume it.")
      case "resume":
        return t(
          "Your distributor will have access back to the rewards pool if you enabled it, and users will start receiving rewards for their actions again.",
        )
    }
  }, [actionToConfirm, t])

  const ManagementOptionsContent = useMemo(
    () => (
      <>
        {!isPaused && (
          <VStack
            align="start"
            gap={4}
            border="1px solid #D5D5D5"
            borderRadius="20px"
            p="16px"
            justifyContent="space-between">
            <HStack gap={2}>
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg={isEnabled ? "#3DBA67" : "#C84968"}
                boxShadow={isEnabled ? "0 0 8px rgba(72, 187, 120, 0.5)" : "0 0 8px rgba(245, 101, 101, 0.5)"}
              />
              <Text textStyle="lg" fontWeight="semibold">
                {t("Rewards Pool")}
              </Text>
            </HStack>
            {!isEnabled ? (
              <>
                <Text textStyle="sm">
                  <Trans
                    i18nKey="The rewards pool holds B3TR used to reward user actions. When you enable it, <bold>the pool starts empty</bold>, remember to <bold>fill it with funds</bold> to distribute rewards."
                    components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                  />
                </Text>
                <Button
                  variant="primary"
                  borderRadius="full"
                  w="200px"
                  onClick={() => handleShowConfirmation("enable")}>
                  {t("Enable")}
                </Button>
              </>
            ) : (
              <>
                <Text textStyle="sm">
                  <Trans
                    i18nKey="When you disabled rewards pool, <bold>the funds will move to app balance</bold>, you can enable it back at any time. The distributor will <bold>stop distributing rewards</bold> from the app balance pool."
                    components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                  />
                </Text>
                <Button
                  variant="primary"
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
          gap={4}
          border={isPaused ? "1px solid #C84968" : "1px solid #D5D5D5"}
          boxShadow={isPaused ? "0 0 8px rgba(245, 101, 101, 0.5)" : "none"}
          borderRadius="20px"
          p="16px"
          mt={isPaused ? "0" : "24px"}
          justifyContent="space-between">
          <HStack gap={2}>
            {isPaused && (
              <Box w="8px" h="8px" borderRadius="full" bg={"#C84968"} boxShadow={"0 0 8px rgba(245, 101, 101, 0.5)"} />
            )}
            <Text textStyle="lg" fontWeight="semibold">
              {isPaused ? t("Resume Distribution") : t("Pause Distribution")}
            </Text>
          </HStack>
          {isPaused ? (
            <>
              <Text textStyle="sm">
                <Trans
                  i18nKey="<bold>Resume the distribution</bold> to distribute rewards again and set a rewards pool."
                  components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                />
              </Text>
              <Button colorPalette="red" borderRadius="full" w="200px" onClick={() => handleShowConfirmation("resume")}>
                {t("Resume Distribution")}
              </Button>
            </>
          ) : (
            <>
              <Text textStyle="sm">
                <Trans
                  i18nKey="You can pause your app distribution. This will <bold>stop your distributor from distributing rewards</bold>. You can resume the distribution at any time. This action won't affect your app's pools."
                  components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                />
              </Text>
              <Button w="200px" colorPalette="red" onClick={() => handleShowConfirmation("pause")}>
                {t("Pause Distribution")}
              </Button>
            </>
          )}
        </VStack>
      </>
    ),
    [t, isPaused, isEnabled, handleShowConfirmation],
  )

  const ConfirmationContent = useMemo(
    () => (
      <VStack justifyContent="space-between">
        <VStack border="1px solid #D5D5D5" borderRadius="20px" p="20px">
          <ExclamationTriangle size={"100px"} />

          <Text textStyle="md" fontWeight="semibold">
            {confirmationText}
          </Text>
          <Text textStyle="sm" textAlign={"center"} px={8}>
            {informationOnConfirmationText}
          </Text>
        </VStack>
        <HStack mt={6} gap={4} width="full">
          <Button variant="ghost" color="actions.tertiary.default" flex={1} onClick={goToPrevious}>
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
        title: t("Manage distribution"),
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
    />
  )
}
