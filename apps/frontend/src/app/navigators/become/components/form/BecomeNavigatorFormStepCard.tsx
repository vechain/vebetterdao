import { Button, Card, HStack, Stack, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useGetMaxStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMaxStake"
import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"
import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { useIsAutoVotingEnabled } from "@/api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { useRegisterNavigator } from "@/hooks/navigator/useRegisterNavigator"
import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"
import { uploadBlobToIPFS } from "@/utils/ipfs"

import { AcknowledgeStep } from "../steps/AcknowledgeStep"
import { DisclosuresStep } from "../steps/DisclosuresStep"
import { MotivationStep } from "../steps/MotivationStep"
import { StakeStep } from "../steps/StakeStep"

import { BecomeNavigatorFormStepIndicator } from "./BecomeNavigatorFormStepIndicator"

export enum NavigatorFormStep {
  MOTIVATION = "MOTIVATION",
  DISCLOSURES = "DISCLOSURES",
  STAKE = "STAKE",
  ACCEPT_TERMS = "ACCEPT_TERMS",
}

export type NavigatorStep = {
  key: NavigatorFormStep
  content: React.ReactNode
  title: string
}

const FIRST_STEP = 0
const LAST_STEP = 3

export const BecomeNavigatorFormStepCard = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const data = useNavigatorApplicationStore(s => s.data)
  const currentStep = useNavigatorApplicationStore(s => s.currentStep)
  const setCurrentStep = useNavigatorApplicationStore(s => s.setCurrentStep)
  const clearData = useNavigatorApplicationStore(s => s.clearData)
  const { data: minStake } = useGetMinStake()
  const { data: maxStake } = useGetMaxStake()
  const { data: isDelegated } = useIsDelegated(account?.address)
  const { data: isAutoVotingEnabled } = useIsAutoVotingEnabled()
  const [isUploading, setIsUploading] = useState(false)
  const hasNavigatedRef = useRef(false)

  const handleSuccess = useCallback(() => {
    if (hasNavigatedRef.current) return
    hasNavigatedRef.current = true

    if (account?.address) {
      router.push(`/navigators/${account.address}?registered=true`)
    } else {
      router.push("/navigators")
    }
    clearData()
  }, [clearData, router, account])

  const { sendTransaction, status } = useRegisterNavigator({
    onSuccess: handleSuccess,
  })

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return data.motivation.trim().length > 0 && data.qualifications.trim().length > 0
      case 1:
        return true
      case 2: {
        const stakeNum = Number(data.stakeAmount) || 0
        const minNum = minStake ? Number(minStake.scaled) : 0
        const maxNum = maxStake ? Number(maxStake.scaled) : Infinity
        return stakeNum >= minNum && stakeNum <= maxNum && stakeNum > 0
      }
      case 3: {
        const delegationAck = isDelegated ? data.acceptedDelegationExit : true
        const autoVotingAck = isAutoVotingEnabled ? data.acceptedAutoVotingDisable : true
        return (
          data.acceptedVotingPenalty &&
          data.acceptedReportPenalty &&
          data.acceptedDisclosurePenalty &&
          delegationAck &&
          autoVotingAck
        )
      }
      default:
        return false
    }
  }, [currentStep, data, minStake, maxStake, isDelegated, isAutoVotingEnabled])

  const steps: NavigatorStep[] = useMemo(
    () => [
      { key: NavigatorFormStep.MOTIVATION, content: <MotivationStep />, title: t("Motivation") },
      { key: NavigatorFormStep.DISCLOSURES, content: <DisclosuresStep />, title: t("Disclosures") },
      { key: NavigatorFormStep.STAKE, content: <StakeStep />, title: t("Stake") },
      { key: NavigatorFormStep.ACCEPT_TERMS, content: <AcknowledgeStep />, title: t("Accept terms") },
    ],
    [t],
  )

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async () => {
    if (!account?.address) return
    setIsUploading(true)

    try {
      const metadata = {
        motivation: data.motivation,
        qualifications: data.qualifications,
        votingStrategy: data.votingStrategy,
        disclosures: {
          isAppAffiliated: data.isAppAffiliated,
          affiliatedAppNames: data.affiliatedAppNames,
          isFoundationMember: data.isFoundationMember,
          foundationRole: data.foundationRole,
          hasConflictsOfInterest: data.hasConflictsOfInterest,
          conflictsDescription: data.conflictsDescription,
        },
        socials: {
          twitter: data.twitterHandle,
          discord: data.discordHandle,
          website: data.websiteUrl,
          other: data.otherLinks,
        },
        registeredAt: new Date().toISOString(),
        address: account.address,
      }

      const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" })
      const ipfsHash = await uploadBlobToIPFS(blob, "navigator-metadata.json")
      const uri = `ipfs://${ipfsHash}`

      await sendTransaction({ stakeAmount: data.stakeAmount, metadataURI: uri })
    } catch (error) {
      console.error("Failed to register:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const isSubmitting = isUploading || status === "pending"
  const currentStepData = steps[currentStep]

  return (
    <Card.Root p={{ base: "6", md: "8" }}>
      <Card.Body>
        <VStack gap={4} w="full" align="flex-start">
          <BecomeNavigatorFormStepIndicator activeStep={currentStep} steps={steps} />

          {currentStepData?.content}

          <Stack w="full" justify="space-between" direction={{ base: "column", md: "row" }}>
            <HStack gap={4} w="full">
              {currentStep !== FIRST_STEP && (
                <Button w="40" type="button" onClick={goBack} variant="secondary" size="lg">
                  {t("Back")}
                </Button>
              )}
              {currentStep === LAST_STEP ? (
                <Button
                  w="40"
                  variant="primary"
                  onClick={onSubmit}
                  disabled={!canProceed() || isSubmitting}
                  loading={isSubmitting}
                  size="lg">
                  {t("Register")}
                </Button>
              ) : (
                <Button w="40" variant="primary" onClick={goNext} disabled={!canProceed()} size="lg">
                  {t("Continue")}
                </Button>
              )}
            </HStack>
            {currentStep === FIRST_STEP && (
              <Button w="40" variant="link" onClick={() => router.push("/navigators")} size="lg">
                {t("Cancel")}
              </Button>
            )}
          </Stack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
