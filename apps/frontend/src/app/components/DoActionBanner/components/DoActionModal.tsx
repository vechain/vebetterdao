import { useCurrentSustainabilityOverview } from "@/api"
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
  const { data: userOverview, isLoading: isUserOverviewLoading } = useCurrentSustainabilityOverview()
  const actionsPerformed = userOverview?.actionsRewarded ?? 0
  // TODO: get this from the backend
  const totalActions = 10
  const actionsNeeded = totalActions - actionsPerformed
  const router = useRouter()
  const goToApps = useCallback(() => {
    router.push("/apps")
  }, [router])
  if (actionsPerformed >= totalActions || isUserOverviewLoading) return null

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
                      w={`${(actionsPerformed / totalActions) * 100}%`}
                      bg="#F29B32"></Flex>
                    <Text fontWeight={700} fontSize={"xs"} zIndex={1}>
                      {t("YOU CANNOT VOTE YET")}
                    </Text>
                  </Flex>
                  <Flex justify="flex-end">
                    <Text color="#6A6A6A" fontWeight="400" fontSize="xs">
                      {t("{{actionsPerformed}}/{{totalActions}} actions performed", { actionsPerformed, totalActions })}
                    </Text>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>
            <Heading fontSize={"2xl"} fontWeight={700}>
              {t("You need {{actionsNeeded}} more actions to become able to vote on this round.", { actionsNeeded })}
            </Heading>
            <Text color="#6A6A6A" fontWeight={400}>
              {t(
                "To be able to vote on this round’s allocations and proposals, you have to do Better actions in the applications. Be more sustainable and earn tokens!",
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
