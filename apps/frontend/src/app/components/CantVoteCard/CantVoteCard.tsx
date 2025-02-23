import { Card, CardBody, HStack, Text, VStack, Button } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/dapp-kit-react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useVotingStatusMessages } from "@/hooks"

export const CantVoteCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()

  const { cantVoteReasonText, isLoading } = useVotingStatusMessages({
    address: account ?? undefined,
    isConnectedUser: true,
  })
  const handleGoToLinking = useCallback(() => {
    router.push("/profile?tab=linked-accounts")
  }, [router])

  const handleGoToGovernance = useCallback(() => {
    router.push("/profile?tab=governance")
  }, [router])

  if (isLoading || !cantVoteReasonText) return null

  return (
    <Card bg="#FFF3E5" border="1px solid #AF5F00" rounded="xl" w="full" h={"full"}>
      <CardBody position="relative" overflow="hidden" borderRadius="xl" padding={{ base: 4, md: 6 }}>
        <VStack spacing={0} w="full" align="flex-start">
          <HStack align={["flex-start", "flex-start", "center"]} position="relative" w="full" h="full">
            <UilInfoCircle size={36} color="#AF5F00" />
            <VStack spacing={0} w="full" align="flex-start">
              <Text fontWeight="700" color="#AF5F00" as="span">
                {" "}
                {cantVoteReasonText.warningTitle}{" "}
              </Text>
              <Text color="#AF5F00" as="span">
                {cantVoteReasonText.warningDescription}
              </Text>
            </VStack>
          </HStack>
          {cantVoteReasonText.onLearnMoreClick && (
            <Button
              variant="link"
              color="#AF5F00"
              fontWeight="700"
              onClick={
                cantVoteReasonText?.onLearnMoreClick === handleGoToLinking
                  ? handleGoToLinking
                  : cantVoteReasonText?.onLearnMoreClick === handleGoToGovernance
                    ? handleGoToGovernance
                    : cantVoteReasonText?.onLearnMoreClick
              }
              mt={2}
              pl={12}>
              {t("Learn more")}
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
