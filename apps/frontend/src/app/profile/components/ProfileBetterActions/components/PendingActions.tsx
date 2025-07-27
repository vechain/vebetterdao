import { useCanUserVote, useGetDelegatee, useUserScore } from "@/api"
import { useMissingActionsLabel } from "@/hooks"
import { Heading, Text, Flex, VStack, Card, HStack, Image } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  address: string
}
export const PendingActions = ({ address }: Props) => {
  const { t } = useTranslation()

  const { isPerson, isLoading } = useCanUserVote(address)
  const { data: delegateeAddress, isLoading: isDelegateeLoading } = useGetDelegatee(address)
  const isDelegator = !isDelegateeLoading && !!delegateeAddress
  const { missingActions, isUserDelegatee, scorePercentage, isLoading: isScoreLoading } = useUserScore(address)

  const missingActionsLabel = useMissingActionsLabel({ missingActions, isUserDelegatee })

  if (isScoreLoading || isPerson || isLoading || isDelegator) return null

  return (
    <Card.Root bg="#FFD979" borderRadius="xl" w="full">
      <Card.Body position="relative" overflow="hidden" borderRadius="xl">
        <Image
          src="/assets/backgrounds/cloud-background-orange.webp"
          alt="cloud-background-orange"
          position="absolute"
          right={"-50%"}
          top={"-50%"}
        />

        <HStack hideBelow="md" align="stretch" zIndex={1} position="relative" w="full">
          <Image src="/assets/icons/info-bell.webp" alt="Pending actions" w={32} h={32} />
          <VStack align="stretch" flex={1} gap={4}>
            <HStack align="flex-start" justify={"space-between"}>
              <VStack align="stretch" gap={0.5}>
                <Text textStyle="xs" color="#8D6602" fontWeight="600">
                  {t("PENDING ACTIONS")}
                </Text>
                <Heading fontSize="lg" fontWeight="700" color="#5F4400">
                  {missingActionsLabel.long}
                </Heading>
              </VStack>
            </HStack>
            <VStack align="stretch" flex={1}>
              <Flex
                bg="white"
                justify="center"
                align="center"
                p={2}
                borderRadius="base"
                position="relative"
                overflow={"hidden"}>
                <Flex
                  position="absolute"
                  top={0}
                  left={0}
                  bottom={0}
                  w={`${scorePercentage * 100}%`}
                  bg="#F29B32"></Flex>
                <Text fontWeight={700} fontSize={"xs"} zIndex={1}>
                  {t("YOU CANNOT VOTE YET")}
                </Text>
              </Flex>
              <Flex justify="center">
                <Text color="#6A6A6A" fontWeight="400" fontSize="xs">
                  {missingActions ? missingActionsLabel.short : t("You are qualified!")}
                </Text>
              </Flex>
            </VStack>
          </VStack>
        </HStack>

        <VStack hideFrom="md" align="stretch" zIndex={1} position="relative">
          <HStack align="flex-start" justify={"space-between"}>
            <VStack align="stretch" gap={0.5}>
              <Text textStyle="xs" color="#8D6602" fontWeight="600">
                {t("PENDING ACTIONS")}
              </Text>
              <Heading fontSize="lg" fontWeight="700" color="#5F4400">
                {t("Increase your sustainable score to become eligible for voting.")}
              </Heading>
            </VStack>
            <Image src="/assets/icons/info-bell.webp" alt="Pending actions" w={24} h={24} />
          </HStack>
          <Flex
            bg="white"
            justify="center"
            align="center"
            p={2}
            borderRadius="base"
            position="relative"
            overflow={"hidden"}>
            <Flex position="absolute" top={0} left={0} bottom={0} w={`${scorePercentage}%`} bg="#F29B32"></Flex>
            <Text fontWeight={700} fontSize={"xs"} zIndex={1}>
              {t("YOU CANNOT VOTE YET")}
            </Text>
          </Flex>
          <Flex justify="flex-end">
            <Text color="#6A6A6A" fontWeight="400" fontSize="xs">
              {missingActions
                ? t("You need {{missingActions}} more actions", {
                    missingActions,
                  })
                : t("You are qualified!")}
            </Text>
          </Flex>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
