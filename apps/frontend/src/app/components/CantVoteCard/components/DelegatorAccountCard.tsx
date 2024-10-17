import { Text, Card, CardBody, HStack, Show, Flex, Box } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useUserDelegation } from "@/api"

export const DelegatorAccountCard = () => {
  const { t } = useTranslation()
  const { isDelegator, isLoading: isLoadingDelegator } = useUserDelegation()

  const router = useRouter()
  const handleGoToGovernance = useCallback(() => {
    router.push("/profile?tab=governance")
  }, [router])

  if (!isDelegator || isLoadingDelegator) return null

  return (
    <Card bg="#FFF3E5" border="1px solid #AF5F00" rounded="xl" w="full" h={"full"}>
      <CardBody position="relative" overflow="hidden" borderRadius="xl" padding={{ base: 4, md: 6 }}>
        <HStack align="center" zIndex={1} position="relative" w="full" h="full" alignItems={"flex-start"}>
          <Show above="md">
            <UilInfoCircle size={36} color="#AF5F00" />
          </Show>
          <Flex flex={1}>
            <Box>
              <Text fontWeight="700" color="#AF5F00" as="span">
                {t("You can’t vote because this is a delegated account.")}
              </Text>
              <Text color="#AF5F00" as="span">
                {" "}
                {t("Go to your profile to learn more about delegated accounts.")}{" "}
              </Text>
              <Text
                textDecoration="underline"
                color="#AF5F00"
                as="span"
                onClick={handleGoToGovernance}
                cursor="pointer">
                {t("Learn more")}
              </Text>
            </Box>
          </Flex>
          <Show below="md">
            <Flex>
              <UilInfoCircle size={36} color="#AF5F00" />
            </Flex>
          </Show>
        </HStack>
      </CardBody>
    </Card>
  )
}
