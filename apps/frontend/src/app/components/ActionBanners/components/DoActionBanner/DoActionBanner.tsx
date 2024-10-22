import {
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  HStack,
  Image,
  Button,
  useDisclosure,
  Show,
  useMediaQuery,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { DoActionModal } from "./components/DoActionModal"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useUserScore } from "@/api/indexer/sustainability/useUserScore"
import { useMemo } from "react"

export const DoActionBanner = () => {
  const { t } = useTranslation()
  const doActionModal = useDisclosure()
  const { isUserDelegatee, isLoading: isLoadingUserScore } = useUserScore()

  const [isVerySmallMobile] = useMediaQuery("(max-height: 667px)")

  const description = useMemo(() => {
    if (isUserDelegatee)
      return t("Your delegator has to complete Better Actions in our apps and unlock your right to vote.")
    return t("Complete Better Actions in our apps and unlock your right to vote. Make your impact count!")
  }, [t, isUserDelegatee])

  if (isLoadingUserScore) return null

  return (
    <Card bg="#FFD979" borderRadius="xl" w="full">
      <CardBody position="relative" overflow="hidden" borderRadius="xl" padding={{ base: 4, md: 6 }}>
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
                  {t("TIME TO STEP UP! 🏃🏼‍♂️")}
                </Text>
                <Heading fontSize="lg" fontWeight="700" color="#5F4400">
                  {description}
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
          <HStack align="center" zIndex={1} position="relative" w="full" alignItems={"center"}>
            <VStack gap={2} align="stretch" justify={"space-between"}>
              <Text fontSize={12} color="#8D6602" fontWeight="600">
                {t("TIME TO STEP UP! 🏃🏼‍♂️")}
              </Text>
              <Heading fontSize="18" fontWeight="700" color="#5F4400">
                {description}
              </Heading>
              <Button
                onClick={doActionModal.onOpen}
                borderRadius="full"
                bg="transparent"
                border="1px solid #5F4400"
                leftIcon={<UilInfoCircle />}
                _hover={{
                  bg: "#5F440020",
                }}>
                <Text color="#5F4400" fontWeight="500" fontSize={16}>
                  {t("Know more")}
                </Text>
              </Button>
            </VStack>
            <Image
              src="/images/info-bell.png"
              alt="Pending actions"
              w={isVerySmallMobile ? 16 : 24}
              h={isVerySmallMobile ? 16 : 24}
            />
          </HStack>
        </Show>
      </CardBody>
      <DoActionModal doActionModal={doActionModal} />
    </Card>
  )
}
