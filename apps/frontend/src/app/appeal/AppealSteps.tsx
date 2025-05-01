import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AnalyticsUtils } from "@/utils"
import { useWallet } from "@vechain/vechain-kit"
import { queryClient, useUserBotSignals } from "@/api"
import {
  VStack,
  Heading,
  Spinner,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepNumber,
  StepIcon,
  StepTitle,
  StepDescription,
  StepSeparator,
  Box,
  useSteps,
  Link,
  Text,
  Alert,
  AlertTitle,
  AlertIcon,
} from "@chakra-ui/react"
import { UilTimesCircle } from "@iconscout/react-unicons"

import { useRouter } from "next/navigation"
import { getVerifiedVetDomainQueryKey, useVerifiedVetDomain } from "./hooks/useVerifiedVetDomain"
import { ResetingResult } from "./ResetingResult"

const VET_DOMAINS_VERIFY_URL = "https://vet.domains/verify"
const REDIRECT_URL = "https://governance.vebetterdao.org/appeal"

const STEPS = [
  { id: "step-1", title: "Start", description: "Begin your DAO access appeal" },
  {
    id: "step-2",
    title: "Verify",
    description: "Complete KYC verification of your wallet through",
    hasLink: true,
    linkUrl: `${VET_DOMAINS_VERIFY_URL}?redirect=${REDIRECT_URL}`,
    linkText: "vet.domains",
  },
  {
    id: "step-3",
    title: "Complete",
    description: "Your DAO participation restrictions have been successfully removed",
  },
]

const RESET_SIGNAL_KEY_LOCAL_STORAGE_PREFIX = "bot_signal_reset_success"

export const AppealSteps = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account: connectedAccount } = useWallet()
  const [resetingStatus, setResetingStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const [apiResponse, setApiResponse] = useState<"">()
  const isConnectedUser = !!connectedAccount?.address
  const { data: isVerifiedVetDomain } = useVerifiedVetDomain(connectedAccount?.address)
  const { data: userSignalCounter } = useUserBotSignals(connectedAccount?.address)

  // Check local storage if the user has successfully reset the signal count before
  const hasSuccessfulReset = useMemo(() => {
    if (!connectedAccount?.address) {
      return false
    }
    const resetKey = `${RESET_SIGNAL_KEY_LOCAL_STORAGE_PREFIX}_${connectedAccount.address}`
    return localStorage.getItem(resetKey) === "true"
  }, [connectedAccount?.address])

  // vet.domains verification
  const isVerified = useMemo(() => {
    return isVerifiedVetDomain
  }, [isVerifiedVetDomain])

  // VeBetterPassport signal count
  const userSignaledCount = useMemo(() => {
    return userSignalCounter
  }, [userSignalCounter])

  const getActiveStepIndex = () => {
    if (isVerified && userSignaledCount === 0) {
      return 3 // Third step - After successful reseting signal count
    } else if (isVerified) {
      return 2 // Second step - KYC verification
    } else {
      return 1 // First step - Initial state
    }
  }

  const { activeStep, setActiveStep } = useSteps({
    index: getActiveStepIndex(),
    count: STEPS.length,
  })

  const handleResetingSignal = useCallback(async () => {
    setResetingStatus("pending")

    try {
      const response = await fetch("/api/appeal/reset-signal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: connectedAccount?.address }),
      })
      const data = await response.json()

      if (data.status === "success") {
        // Store successful reset in localStorage
        if (connectedAccount?.address) {
          const resetKey = `${RESET_SIGNAL_KEY_LOCAL_STORAGE_PREFIX}_${connectedAccount.address}`
          localStorage.setItem(resetKey, "true")
        }
        setResetingStatus("success")
        setApiResponse(data.message)
        setActiveStep(3) // After successful reseting signal count
      } else {
        setResetingStatus("error")
        setApiResponse(data.message)
      }
    } catch (error: any) {
      setResetingStatus("error")
      setApiResponse(error)
    }
  }, [connectedAccount?.address, setActiveStep])

  useEffect(() => {
    if (resetingStatus === "success") {
      setActiveStep(3)
    } else if (isVerified) {
      setActiveStep(2)
    } else {
      setActiveStep(1)
    }
  }, [resetingStatus, isVerified, setActiveStep])

  // Refresh verification status when returning from vet.domains
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({
        queryKey: getVerifiedVetDomainQueryKey(connectedAccount?.address),
      })
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [connectedAccount?.address])

  useEffect(() => {
    // Only trigger if
    // - User is verified
    // - User has been flagged at least once
    // - User has signaled has not been reset before
    if (isVerified && userSignaledCount > 0 && !hasSuccessfulReset) {
      handleResetingSignal()
    }
  }, [isVerified, userSignaledCount, hasSuccessfulReset, handleResetingSignal])

  useEffect(() => {
    AnalyticsUtils.trackPage("Appeal")
  }, [])

  useLayoutEffect(() => {
    if (!isConnectedUser) {
      router.push("/error")
    }
  }, [isConnectedUser, router])

  // Return null to prevent flash of content before redirect
  if (!isConnectedUser) {
    return (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size="lg" />
      </VStack>
    )
  }

  const renderStepDescription = (step: (typeof STEPS)[number]) => {
    if (step.hasLink) {
      return (
        <Text>
          {step.description}{" "}
          <Link color="blue.500" href={step.linkUrl} isExternal textDecoration="underline">
            {step.linkText}
          </Link>
        </Text>
      )
    }
    return step.description
  }

  return (
    <VStack gap={6} align="stretch" w="full" maxW={"container.md"} mx="auto" data-testid="appeal-page">
      <Heading size={"xl"}>{t("Wallet Restriction Appeal")}</Heading>

      <Text>
        {
          "Your wallet has been flagged with usage restrictions due to unusual activity or regulatory requirements. Complete the steps below to verify your identity and restore full access to DAO activities."
        }
      </Text>

      <Stepper index={activeStep} size="lg" orientation="vertical" height="350px" gap="0" overflow="visible">
        {STEPS.map((step, index) => (
          <Step key={step.id}>
            <StepIndicator>
              {index === 2 && resetingStatus === "pending" ? (
                <Spinner size="sm" />
              ) : index === 2 && resetingStatus === "error" ? (
                <UilTimesCircle color="#FF0000" />
              ) : (
                <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
              )}
            </StepIndicator>

            <Box flexShrink="1" minWidth="0">
              <StepTitle>{step.title}</StepTitle>
              <StepDescription>{renderStepDescription(step)}</StepDescription>
            </Box>

            <StepSeparator />
          </Step>
        ))}
      </Stepper>

      {userSignaledCount >= 1 && hasSuccessfulReset && (
        <VStack align="stretch" gap={2}>
          <Alert status="warning" size="md" borderRadius="16px">
            <AlertIcon w={4} h={4} color="#F29B32" />
            <Box lineHeight={"1.20rem"} fontSize="md" color="#F29B32">
              <AlertTitle>
                {
                  "You have been flagged again after your KYC. Please reach out to the app admin that flagged you to restore your access."
                }
              </AlertTitle>
            </Box>
          </Alert>
        </VStack>
      )}

      {!hasSuccessfulReset && <ResetingResult resetingStatus={resetingStatus} apiResponse={apiResponse} />}
    </VStack>
  )
}
