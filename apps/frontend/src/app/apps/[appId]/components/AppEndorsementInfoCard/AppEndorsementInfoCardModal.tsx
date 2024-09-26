import { useIsAppUnendorsed, useAppEndorsementScore, useAppEndorsers } from "@/api"
import { EndorsementInfo } from "./EndorsementInfo"
import { EndorsementHistory } from "./EndorsementHistory"
import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Flex,
  Stack,
  Image,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  isOpen: boolean
  onClose: () => void
  appId: string
}

export const AppEndorsementInfoCardModal = ({ isOpen, onClose, appId }: Props) => {
  const { t } = useTranslation()
  const { data: isUnendorsed } = useIsAppUnendorsed(appId)
  const { data: endorsementScore } = useAppEndorsementScore(appId)
  const { data: endorsers } = useAppEndorsers(appId)
  const { data: endorsementEvents } = useAppEndorsedEvents({ appId })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={["xl", "xxl"]}>
      <ModalOverlay />
      <ModalContent mx="5vw">
        <ModalHeader>
          <Flex justify="space-between" align="center" w="100%">
            <Text> {t("X-Node Endorsement")}</Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody rounded={"md"} w={"full"}>
          <Stack
            direction={["column", "column", "row"]}
            w={"full"}
            alignItems={"stretch"}
            spacing={5}
            marginBottom={"3vh"}>
            <VStack flex={1.5} h="full" maxH="50vh" minH="50vh">
              <HStack w="full" justify="space-between">
                <VStack alignItems={"flex-start"}>
                  <Text fontSize={["x-small", "x-small", "medium"]}>{t("Current score")}</Text>
                  <Text fontSize={["medium", "medium", "xx-large"]} fontWeight="800" color="#444AD1">
                    {endorsementScore}
                  </Text>
                </VStack>

                <VStack alignItems={"flex-start"}>
                  <Text fontSize={["x-small", "x-small", "medium"]}>{t("Users endorsing")}</Text>
                  <Text fontSize={["medium", "medium", "xx-large"]} fontWeight="800" color="#444AD1">
                    {endorsers?.length}
                  </Text>
                </VStack>

                <VStack alignItems={"flex-start"}>
                  <Text fontSize={["x-small", "x-small", "medium"]}>{t("Status")}</Text>
                  <Text
                    fontSize={["medium", "medium", "xx-large"]}
                    fontWeight="800"
                    color={isUnendorsed ? "#C84968" : "#3DBA67"}>
                    {isUnendorsed ? t("Not endorsed") : t("Endorsed")}
                  </Text>
                </VStack>
              </HStack>
              <VStack
                display={"flex"}
                bg="#FAFAFA"
                justify={"space-between"}
                rounded={"16px"}
                p={4}
                w={"full"}
                height={"40vh"}
                overflowY="auto">
                <Text
                  style={{ fontFamily: "Instrument Sans, sans-serif" }}
                  fontSize={["medium", "x-large", "x-large"]}
                  fontWeight="600"
                  alignSelf="flex-start">
                  {t("Endorsers")}
                </Text>
                <VStack flex={1} w="full" overflowY="auto" h="full">
                  {endorsers && endorsers.length > 0 ? (
                    endorsers
                      .slice()
                      .reverse()
                      .map((endorser, index) => (
                        <EndorsementInfo key={index} appId={appId} endorserAddress={endorser} />
                      ))
                  ) : (
                    <VStack justify="center" align="center">
                      <Image src="/images/nothing-to-show-endorsement.svg" alt="No endorsement" />
                      <Text fontSize="14px" color="#6A6A6A">
                        {t("There is nothing to show here !")}
                      </Text>
                    </VStack>
                  )}
                </VStack>
              </VStack>
            </VStack>

            <VStack
              bg="#FAFAFA"
              flex={1}
              p={4}
              rounded={"16px"}
              h="full"
              justify={"space-between"}
              overflowY="auto"
              minHeight={"50vh"}
              maxH="50vh">
              <Text
                style={{ fontFamily: "Instrument Sans, sans-serif" }}
                fontSize={["medium", "x-large", "x-large"]}
                fontWeight="600"
                alignSelf={"flex-start"}>
                {t("Endorsement history")}
              </Text>
              <VStack flex={1} w="full" overflowY="auto" h="full">
                {endorsementEvents && endorsementEvents.length > 0 ? (
                  endorsementEvents.map((endorsementEvent, index) => (
                    <EndorsementHistory key={index} event={endorsementEvent} />
                  ))
                ) : (
                  <VStack justify="center" align="center" marginTop={"5vh"}>
                    <Image src="/images/nothing-to-show-endorsement.svg" alt="No endorsement" />
                    <Text fontSize="14px" color="#6A6A6A">
                      {t("There is nothing to show here !")}
                    </Text>
                  </VStack>
                )}
              </VStack>
            </VStack>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
