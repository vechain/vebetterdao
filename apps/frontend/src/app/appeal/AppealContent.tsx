import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AnalyticsUtils } from "@/utils"
import { VStack, Heading, Button, Spinner } from "@chakra-ui/react"

import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useVerifiedVetDomain } from "./hooks/useVerifiedVetDomain"
import { VerificationSection, VerificationResult, AppealDesc, AppealWarning } from "./components"

export const AppealContent = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account: connectedAccount } = useWallet()
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const isConnectedUser = !!connectedAccount?.address
  const { data: isVerifiedVetDomain } = useVerifiedVetDomain(connectedAccount?.address)

  const isVerified = useMemo(() => {
    return false
  }, [isVerifiedVetDomain])

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
      console.log("data", data)

      if (response.ok) {
        setVerificationStatus("success")
      } else {
        setVerificationStatus("error")
      }
    } catch (error) {
      setVerificationStatus("error")
    }
  }

  return (
    <VStack gap={6} align="stretch" maxW={"container.md"} mx="auto" data-testid="appeal-page">
      <Heading size={"xl"}>{t("Wallet Restriction Appeal")}</Heading>

      <VStack bg="white" borderRadius={12} borderWidth={1} borderColor="gray.200" gap={6} p={6}>
        <AppealDesc isVerified={isVerified ?? false} />

        <AppealWarning isVerified={isVerified ?? false} />

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
                ? t("The appeal process is complete. You have just been unbanned.")
                : t("Your KYC verification was unsuccessful. Please try again or contact support.")
            }
          />
        )}
      </VStack>
    </VStack>
  )
}
