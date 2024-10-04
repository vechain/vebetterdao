import { useThresholdParticipationScore, useUserCurrentRoundScore } from "@/api"
import { CustomModalContent } from "@/components"
import {
  Modal,
  ModalBody,
  ModalOverlay,
  UseDisclosureProps,
  Card,
  CardBody,
  VStack,
  Flex,
  Text,
  Heading,
  Button,
  Image,
} from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"

type Props = {
  doActionModal: UseDisclosureProps
}

export const DoActionModal = ({ doActionModal }: Props) => {
  const { t } = useTranslation()
  const { data: scoreThreshold, isLoading: isScoreThresholdLoading } = useThresholdParticipationScore()
  const { data: userScore, isLoading: isUserRoundScoreLoading } = useUserCurrentRoundScore()

  const router = useRouter()
  const goToApps = useCallback(() => {
    router.push("/apps")
  }, [router])
  if (userScore >= scoreThreshold || isUserRoundScoreLoading || isScoreThresholdLoading) return null

  // TODO: understand where the Know more button should go

  return (
    <Modal isOpen={doActionModal.isOpen || false} onClose={doActionModal.onClose || (() => {})}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalBody p={6}>
          <VStack align="stretch" spacing={4}>
            <Card bg="#FFD979" borderRadius="xl" maxW="400px">
              <CardBody pb={2} position="relative" overflow="hidden" borderRadius="xl">
                <Image
                  src="/images/cloud-background-orange.png"
                  alt="cloud-background-orange"
                  position="absolute"
                  right={"-50%"}
                  top={"-50%"}
                />
                <VStack align="stretch" zIndex={1} position="relative">
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
                      w={`${(userScore / scoreThreshold) * 100}%`}
                      bg="#F29B32"></Flex>
                    <Text fontWeight={700} fontSize={"xs"} zIndex={1}>
                      {t("YOU CANNOT VOTE YET")}
                    </Text>
                  </Flex>
                  <Flex justify="flex-end">
                    <Text color="#6A6A6A" fontWeight="400" fontSize="xs">
                      {t("{{userScore}}/{{scoreThreshold}} action score reached", {
                        userScore: userScore ?? 0,
                        scoreThreshold: scoreThreshold ?? 0,
                      })}
                    </Text>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>
            <Heading fontSize={"2xl"} fontWeight={700}>
              {t("Increase your sustainable score to become eligible for voting.")}
            </Heading>
            <Text color="#6A6A6A" fontWeight={400}>
              {t(
                "To be able to vote on the allocation rounds and proposals, you need to increase your sustainability score by doing more sustainable actions using the apps.",
              )}
            </Text>
            <Button variant="primaryAction" leftIcon={<IoGridOutline />} onClick={goToApps}>
              {t("Explore apps")}
            </Button>
            <Button variant="primarySubtle" leftIcon={<UilInfoCircle />} onClick={goToApps}>
              {t("Know more")}
            </Button>
          </VStack>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
