import { useEffect, useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { AnalyticsUtils } from "@/utils"
import {
  VStack,
  Heading,
  Text,
  Box,
  Button,
  Link,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  // useToast,
  Spinner,
} from "@chakra-ui/react"
import { FiExternalLink } from "react-icons/fi"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
// import { useVerifiedVetDomain } from "./hooks/useVerifiedVetDomain"

export const AppealContent = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account: connectedAccount } = useWallet()
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const isConnectedUser = !!connectedAccount?.address
  // const {
  // data: isVerifiedVetDomain,
  // status: verifiedVetDomainStatus,
  // error: verifiedVetDomainError,
  // } = useVerifiedVetDomain(connectedAccount?.address)

  // const isVerified = useMemo(() => {
  //   return isVerifiedVetDomain
  // }, [isVerifiedVetDomain])

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

  // Top section
  const needKYC =
    "Your wallet has been flagged for bot-like behavior. To lift the restriction, please complete the KYC verification process."
  // const alreadyKYCTop =
  //   "Your wallet has been flagged again for bot-like behavior. Since you have already completed the KYC process, you can simply click the button below to appeal."

  // Middle section
  // const alreadyKYCMiddle = "KYC previously completed and verified."

  // Bottom section
  // const needKYCBottom = "Once you completed the KYC, please click on the following button to complete the appeal"
  // const alreadyKYCBottom = "You can appeal again by clicking on the following button"

  // Confirmation section
  const successfulKYCAppeal = "The appeal process is complete. You have just been unbanned."
  const failedKYCAppeal = "Your KYC verification was unsuccessful. Please try again or contact support."

  const getVerificationUrl = () => {
    return "https://vet.domains/verify"
  }

  const handleVerificationSubmit = async () => {
    // Set status to loading
    setVerificationStatus("pending")

    try {
      const response = await fetch("/api/appeal/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: connectedAccount?.address }),
      })

      // const data = await response.json()

      if (response.ok) {
        setVerificationStatus("success")
        // toast({
        //   title: "Verification Successful",
        //   status: "success",
        //   duration: 5000,
        //   isClosable: true,
        // })
      } else {
        setVerificationStatus("error")
        // toast({
        //   title: "Verification Failed",
        //   description: data.message,
        //   status: "error",
        //   duration: 5000,
        //   isClosable: true,
        // })
      }
    } catch (error) {
      setVerificationStatus("error")
      // toast({
      //   title: "Verification Failed",
      //   description: "An unexpected error occurred",
      //   status: "error",
      //   duration: 5000,
      //   isClosable: true,
      // })
    }
  }

  return (
    <VStack gap={6} align="stretch" w="full" maxW={"container.md"} mx="auto" data-testid="appeal-page">
      <Heading size={"xl"}>{t("Wallet Restriction Appeal")}</Heading>

      <VStack bg="white" borderRadius={12} p={6} gap={6}>
        <Text color="black" fontSize="md" fontWeight={400}>
          {needKYC}
        </Text>

        <Alert status="warning" borderRadius="16px" bg="#FFF3E5">
          <AlertIcon color="#F29B32" />
          <Box>
            <Text fontSize="sm">
              {`You must complete the verification using the same wallet address that was flagged.
              Verification with a different wallet will not lift the restrictions on your flagged wallet.`}
            </Text>
          </Box>
        </Alert>

        {/* Verification information */}
        <Box p={6} borderRadius="16px" bg="blue.50">
          <VStack align="stretch" spacing={4}>
            <Heading size="md">{`Complete Identity Verification`}</Heading>

            <Text>
              {`For your security, we'll redirect you to our trusted verification partner (vet.domains) in a new tab.`}
            </Text>

            <Button
              as={Link}
              href={getVerificationUrl()}
              isExternal
              colorScheme="blue"
              rightIcon={<Icon as={FiExternalLink} />}
              width="fit-content"
              _hover={{ textDecoration: "none" }}>
              {`Start Verification`}
            </Button>

            <Text fontSize="sm" color="gray.600">
              {`After completing verification, return to this page and click "I've Completed Verification" below.`}
            </Text>
          </VStack>
        </Box>

        {/* Completion button */}
        <Button
          colorScheme="green"
          size="lg"
          onClick={handleVerificationSubmit}
          isLoading={verificationStatus === "pending"}
          loadingText="Verifying..."
          isDisabled={verificationStatus === "success" || verificationStatus === "pending"}>
          {`I've Completed Verification`}
        </Button>

        {/* Verification result section */}
        {verificationStatus === "success" && (
          <Alert status="success" borderRadius="16px" variant="solid">
            <AlertIcon />
            <Box>
              <AlertTitle fontWeight="600" pb={2}>
                {`Verification Successful`}
              </AlertTitle>
              <Text fontSize="sm">{successfulKYCAppeal}</Text>
            </Box>
          </Alert>
        )}

        {verificationStatus === "error" && (
          <Alert status="error" borderRadius="16px" bg="#FCEEF1">
            <AlertIcon />
            <Box>
              <AlertTitle fontWeight="600" pb={2}>
                {`Verification Failed`}
              </AlertTitle>
              <Text fontSize="sm">{failedKYCAppeal}</Text>
            </Box>
          </Alert>
        )}
      </VStack>
    </VStack>
  )
}
