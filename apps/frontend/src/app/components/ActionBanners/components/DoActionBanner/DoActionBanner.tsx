import { Heading, Text, VStack, Card, CardBody, HStack, Image, Button, useDisclosure, Show } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { DoActionModal } from "./components/DoActionModal"
import { useCurrentSustainabilityOverview } from "@/api"
import { UilInfoCircle } from "@iconscout/react-unicons"

export const DoActionBanner = () => {
  const { t } = useTranslation()
  const doActionModal = useDisclosure()
  const {
    data: userOverview,
    isLoading: isUserOverviewLoading,
    error: userOverviewError,
  } = useCurrentSustainabilityOverview()
  const actionsPerformed = userOverview?.actionsRewarded ?? 0
  // TODO: get this from the backend
  const totalActions = 10
  if (actionsPerformed >= totalActions || isUserOverviewLoading || userOverviewError) return null

  return (
    <Card bg="#FFD979" borderRadius="xl">
      <CardBody position="relative" overflow="hidden" borderRadius="xl">
        <Image
          src="/images/cloud-background-orange.png"
          alt="cloud-background-orange"
          position="absolute"
          right={["-50%", "-50%", "-10%"]}
          top={["-50%", "-50%", "-150%"]}
        />
        <Show above="md">
          <HStack align="stretch" zIndex={1} position="relative" w="full">
            <Image src="/images/info-bell.png" alt="Pending actions" w={24} h={24} />
            <HStack flex={1}>
              <VStack gap={2} align="stretch" flex={1}>
                <Text size="xs" color="#8D6602" fontWeight="600">
                  {t("YOU ARE LAZY THIS WEEK!")}
                </Text>
                <Heading fontSize="lg" fontWeight="700" color="#5F4400">
                  {t("Do some Better Actions in our apps to become able to vote!")}
                </Heading>
              </VStack>
              <Button
                onClick={doActionModal.onOpen}
                borderRadius="full"
                bg="transparent"
                border="1px solid #5F4400"
                leftIcon={<UilInfoCircle />}
                _hover={{
                  bg: "#5F440020",
                }}>
                <Text color="#5F4400" fontWeight="500">
                  {t("Know more")}
                </Text>
              </Button>
            </HStack>
          </HStack>
        </Show>
        <Show below="md">
          <HStack align="stretch" zIndex={1} position="relative" w="full">
            <VStack gap={2} align="stretch" justify={"space-between"}>
              <Text size="xs" color="#8D6602" fontWeight="600">
                {t("YOU ARE LAZY THIS WEEK!")}
              </Text>
              <Heading fontSize="lg" fontWeight="700" color="#5F4400">
                {t("Do some Better Actions in our apps to become able to vote!")}
              </Heading>
              <Button
                onClick={doActionModal.onOpen}
                borderRadius="full"
                bg="transparent"
                border="1px solid #5F4400"
                _hover={{
                  bg: "#5F440020",
                }}>
                <Text color="#5F4400" fontWeight="500">
                  {t("Tell me more")}
                </Text>
              </Button>
            </VStack>
            <Image src="/images/info-bell.png" alt="Pending actions" w={24} h={24} />
          </HStack>
        </Show>
      </CardBody>
      <DoActionModal doActionModal={doActionModal} />
    </Card>
  )
}
