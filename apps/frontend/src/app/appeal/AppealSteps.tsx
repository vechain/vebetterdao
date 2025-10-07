import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { AnalyticsUtils } from "@/utils"
import { useWallet } from "@vechain/vechain-kit"
import { queryClient, useUserBotSignals, useUserSignalEvents, useXApps } from "@/api"
import { VStack, Heading, Spinner, Steps, Box, Link, Text, Alert, List } from "@chakra-ui/react"

import { useRouter } from "next/navigation"
import { getVerifiedVetDomainQueryKey, useVerifiedVetDomain } from "./hooks/useVerifiedVetDomain"
import { ResetingResult } from "./components/ResetingResult"
import { RESET_SIGNAL_KEY_LOCAL_STORAGE_PREFIX, VET_DOMAINS_VERIFY_URL, REDIRECT_URL, RESET_STATUS } from "./constants"
import { ResetStatus } from "./types"
import {
  linkClickActions,
  LinkClickProperties,
  linkClicked,
  signalReset,
  SignalResetProperties,
  signalResetActions,
  signaledAfterKYC,
} from "@/constants"
import NextLink from "next/link"

export const AppealSteps = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account: connectedAccount } = useWallet()
  const [resetingStatus, setResetingStatus] = useState<ResetStatus>(RESET_STATUS.IDLE)
  const [apiResponse, setApiResponse] = useState<string>()
  const isConnectedUser = !!connectedAccount?.address
  const { data: isVerifiedVetDomain } = useVerifiedVetDomain(connectedAccount?.address)
  const { data: userSignalCounter } = useUserBotSignals(connectedAccount?.address)
  const { data: userSignalEvents } = useUserSignalEvents(connectedAccount?.address as string)
  const { data: apps } = useXApps()
  const initialRenderRef = useRef(true) // Track initial render

  function getAppName(appId: string): string {
    const found = apps?.allApps.find(app => app.id === appId)
    return found ? found.name : "Unknown"
  }

  const STEPS = [
    { id: "step-1", title: t("Start"), description: t("Begin your DAO access appeal") },
    {
      id: "step-2",
      title: t("Verify"),
      description: t("Complete KYC verification of your wallet through"),
      hasLink: true,
      linkUrl: `${VET_DOMAINS_VERIFY_URL}?redirect=${REDIRECT_URL}`,
      linkText: "vet.domains",
    },
    {
      id: "step-3",
      title: t("Complete"),
      description: t("Your DAO participation restrictions have been successfully lifted"),
    },
  ]

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
    return Number(userSignalCounter || 0)
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

  const [step, setStep] = useState(getActiveStepIndex())

  const handleResetingSignal = useCallback(async () => {
    if (!connectedAccount?.address) {
      setResetingStatus(RESET_STATUS.ERROR)
      setApiResponse("Wallet not connected")
      return
    }

    setResetingStatus(RESET_STATUS.PENDING)

    try {
      const response = await fetch("/api/appeal/reset-signal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: connectedAccount?.address }),
      })
      const data = await response.json()

      if (data.status === RESET_STATUS.SUCCESS) {
        // Store successful reset in localStorage
        if (connectedAccount?.address) {
          const resetKey = `${RESET_SIGNAL_KEY_LOCAL_STORAGE_PREFIX}_${connectedAccount.address}`
          localStorage.setItem(resetKey, "true")
        }

        setResetingStatus(RESET_STATUS.SUCCESS)
        setApiResponse(data.message)
        setStep(3) // After successful reseting signal count

        AnalyticsUtils.trackEvent(signalReset, signalResetActions(SignalResetProperties.SIGNAL_RESET_SUCCESS))
      } else {
        setResetingStatus(RESET_STATUS.ERROR)
        setApiResponse(data.message)
      }
    } catch (error: any) {
      setResetingStatus(RESET_STATUS.ERROR)
      setApiResponse(error)
    }
  }, [connectedAccount?.address, setStep])

  useEffect(() => {
    if (resetingStatus === RESET_STATUS.SUCCESS) {
      setStep(3)
    } else if (isVerified) {
      setStep(2)
    } else {
      setStep(1)
    }
  }, [resetingStatus, isVerified, setStep])

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
    // - User is verified AND,
    // - User has been flagged at least once AND,
    // - User has signaled has not been reset before
    if (isVerified && userSignaledCount > 0 && !hasSuccessfulReset) {
      handleResetingSignal()
    }
  }, [isVerified, userSignaledCount, hasSuccessfulReset, handleResetingSignal])

  useEffect(() => {
    AnalyticsUtils.trackPage("Appeal")
  }, [])

  useEffect(() => {
    if (userSignaledCount >= 1 && hasSuccessfulReset) {
      AnalyticsUtils.trackEvent(signaledAfterKYC)
    }
  }, [userSignaledCount, hasSuccessfulReset])

  // Redirect to homepage if
  // - user is not connected
  // - appeal is complete (verified with no signals)
  useLayoutEffect(() => {
    if (!isConnectedUser) {
      router.push("/")
      return
    }

    // Only redirect on initial conditions, not when they change later
    if (initialRenderRef.current && isVerified && Number(userSignaledCount) === 0) {
      router.push("/")
    }

    // Mark initial render complete
    initialRenderRef.current = false
  }, [isConnectedUser, isVerified, userSignaledCount, router])

  // Return null to prevent flash of content before redirect
  if (!isConnectedUser) {
    return (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size="lg" />
      </VStack>
    )
  }

  const renderStepDescription = (step: (typeof STEPS)[number]) => {
    if (step.hasLink) {
      return (
        <Text>
          {step.description}{" "}
          <Link color="blue.500" asChild textDecoration="underline">
            <NextLink href={step.linkUrl}>{step.linkText}</NextLink>
          </Link>
        </Text>
      )
    }
    return step.description
  }

  return (
    <VStack gap={6} align="stretch" w="full" maxW="breakpoint-md" mx="auto" data-testid="appeal-page">
      <Heading size={"xl"}>{t("Wallet Restriction Appeal")}</Heading>

      <Text>
        {
          "Your wallet has been flagged with usage restrictions due to unusual activity or regulatory requirements. Complete the steps below to verify your identity and restore full access to DAO activities."
        }
      </Text>

      <Steps.Root
        defaultStep={1}
        step={step}
        onStepChange={e => setStep(e.step)}
        count={STEPS.length}
        size="lg"
        orientation="vertical"
        height="350px"
        gap="0"
        overflow="visible"
        colorPalette="blue">
        <Steps.List>
          {STEPS.map((step, index) => (
            <Steps.Item key={step.id} index={index}>
              <Steps.Indicator colorPalette="blue.500" />

              <Box flexShrink="1" minWidth="0">
                <Steps.Title>{step.title}</Steps.Title>
                <Steps.Description>{renderStepDescription(step)}</Steps.Description>
              </Box>

              <Steps.Separator />
            </Steps.Item>
          ))}
        </Steps.List>
      </Steps.Root>

      {userSignaledCount >= 1 && hasSuccessfulReset && (
        <VStack align="stretch" gap={2}>
          <Alert.Root status="warning" size="md" borderRadius="16px">
            <Box textStyle="md" color="status.positive.primary">
              <Alert.Title>
                {
                  "You have been flagged again after your KYC. Please reach out to the app admin that flagged you to restore your access."
                }
              </Alert.Title>

              <List.Root listStyleType="-" p={3}>
                {userSignalEvents?.activeSignalEvents
                  .filter((event, index, self) => self.findIndex(e => e.appId === event.appId) === index)
                  .map(event => (
                    <List.Item
                      key={event.appId}
                      onClick={() => {
                        AnalyticsUtils.trackEvent(
                          linkClicked,
                          linkClickActions(LinkClickProperties.REDIRECT_TO_APP_PAGE),
                        )
                        router.push(`/apps/${event.appId}`)
                      }}
                      cursor="pointer"
                      textDecoration="underline"
                      _hover={{
                        color: "blue.700",
                        textDecoration: "underline",
                      }}>
                      {getAppName(event.appId)}
                    </List.Item>
                  ))}
              </List.Root>
            </Box>
          </Alert.Root>
        </VStack>
      )}

      {!hasSuccessfulReset && <ResetingResult resetingStatus={resetingStatus} apiResponse={apiResponse} />}
    </VStack>
  )
}
