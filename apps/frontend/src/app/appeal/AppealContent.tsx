import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AnalyticsUtils } from "@/utils"
import { useWallet } from "@vechain/vechain-kit"
import { useUserBotSignals } from "@/api"
import { VStack, Heading, Button, Spinner } from "@chakra-ui/react"

import { useRouter } from "next/navigation"
import { useVerifiedVetDomain } from "./hooks/useVerifiedVetDomain"
import { VerificationSection, VerificationResult, AppealDesc, AppealWarning } from "./components"

export const AppealContent = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account: connectedAccount } = useWallet()
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const [verificationResult, setVerificationResult] = useState<"">()
  const isConnectedUser = !!connectedAccount?.address
  const { data: isVerifiedVetDomain } = useVerifiedVetDomain(connectedAccount?.address)
  const { data: userSignalCounter } = useUserBotSignals(connectedAccount?.address)

  const isVerified = useMemo(() => {
    return isVerifiedVetDomain
  }, [isVerifiedVetDomain])

  const userSignaledCount = useMemo(() => {
    return userSignalCounter
  }, [userSignalCounter])

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

  const handleVerificationSubmit = async () => {
    setVerificationStatus("pending")

    try {
      const response = await fetch("/api/appeal/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: connectedAccount?.address }),
      })

      const data = await response.json()

      if (data.status === "success") {
        setVerificationStatus("success")
        setVerificationResult(data.message)
      } else {
        setVerificationStatus("error")
        setVerificationResult(data.message)
      }
    } catch (error: any) {
      setVerificationStatus("error")
      setVerificationResult(error)
    }
  }

  return (
    <VStack gap={6} align="stretch" maxW={"container.md"} mx="auto" data-testid="appeal-page">
      <Heading size={"xl"}>{t("Wallet Restriction Appeal")}</Heading>

      <VStack bg="white" borderRadius={16} borderWidth={1} borderColor="gray.200" gap={10} p={6}>
        {!isVerified && (
          <AppealDesc
            description={
              userSignaledCount >= 2
                ? t(
                    "Your wallet has received 2 or more bot signals and is now restricted from DAO participation. Complete verification immediately to restore access and prevent permanent banning.",
                  )
                : t(
                    "Your wallet has been flagged for bot-like behavior. To lift the restriction and avoid a permanent ban, please complete the KYC verification process.",
                  )
            }
          />
        )}

        <AppealWarning
          walletAddress={connectedAccount?.address ?? ""}
          title={t("Important: Use the same wallet address")}
          description={t(
            isVerified
              ? "You have already completed the verification. Please click the button below to appeal."
              : "You must complete the verification using the same wallet address that was flagged. Verification with a different wallet will not lift the restrictions on your flagged wallet.",
          )}
        />

        {!isVerified && <VerificationSection />}

        <Button
          colorScheme="green"
          size="lg"
          onClick={handleVerificationSubmit}
          isLoading={verificationStatus === "pending"}
          loadingText={t("Verifying...")}
          isDisabled={verificationStatus === "success" || verificationStatus === "pending"}>
          {t("I've Completed Verification")}
        </Button>

        {(verificationStatus === "success" || verificationStatus === "error") && (
          <VerificationResult
            status={verificationStatus as "success" | "error"}
            title={verificationStatus === "success" ? t("Verification Successful") : t("Verification Failed")}
            description={
              verificationStatus === "success"
                ? t("The appeal process is complete.")
                : t("Your KYC verification was unsuccessful. Please try again or contact support.")
            }
            result={verificationResult}
          />
        )}
      </VStack>
    </VStack>
  )
}
