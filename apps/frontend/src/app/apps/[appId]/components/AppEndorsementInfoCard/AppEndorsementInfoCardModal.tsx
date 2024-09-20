import { useIsAppUnendorsed, useAppEndorsementScore, useAppEndorsers } from "@/api"
// import { useEndorsementInfos, useEndorsementHistory } from "@/hooks/useEndorsementData"
import { UserEndorsementInfo } from "./UserEndorsementInfo"

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

  // const endorsementHistory = useEndorsementHistory(appId)

 

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
          <Stack direction={["column", "column", "row"]} w={"full"} alignItems={"stretch"} spacing={8}>
            <VStack flex={1.5} h="full" p={4} maxH="50vh">
              <HStack w="full" justify="space-between">
                <VStack alignItems={"flex-start"}>
                  <Text>{t("Current score")}</Text>
                  <Text fontSize="xx-large" fontWeight="800" color="#444AD1">
                    {endorsementScore}
                  </Text>
                </VStack>

                <VStack alignItems={"flex-start"}>
                  <Text>{t("Users endorsing")}</Text>
                  <Text fontSize="xx-large" fontWeight="800" color="#444AD1">
                    {endorsers?.length}
                  </Text>
                </VStack>

                <VStack alignItems={"flex-start"}>
                  <Text>{t("Status")}</Text>
                  <Text fontSize="xx-large" fontWeight="800" color={isUnendorsed ? "#C84968" : "#3DBA67"}>
                    {isUnendorsed ? t("Not endorsed") : t("Endorsed")}
                  </Text>
                </VStack>
              </HStack>
              <VStack bg="#FAFAFA" justify={"space-between"} rounded={"16px"} p={2} w={"full"} overflowY="auto">
                <Text
                  style={{ fontFamily: "Instrument Sans, sans-serif" }}
                  fontSize="x-large"
                  fontWeight="600"
                  alignSelf="flex-start">
                  {t("Endorsers")}
                </Text>
                <VStack flex={1} w="full" overflowY="auto">
                  {endorsers?.map((endorser, index) => (
                    <UserEndorsementInfo key={index} appId={appId} address={endorser} />
                  ))}
                
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
              maxH="50vh">
              <Text
                style={{ fontFamily: "Instrument Sans, sans-serif" }}
                fontSize="x-large"
                fontWeight="600"
                alignSelf={"flex-start"}>
                {t("Endorsement history")}
              </Text>
              <VStack flex={1} w="full" overflowY="auto">
                {/* {endorsementHistory.map((blockMeta, index) => (
                  <HStack
                    key={index}
                    p={2}
                    borderRadius={"16px"}
                    borderBottom={"1px solid #EFEFEF"}
                    w={"full"}
                    alignItems={"center"}
                    justify={"space-between"}>
                    <VStack align="start" justifyContent={"flex-start"} spacing={0}>
                      <Text>{truncateAddress(blockMeta.txOrigin)}</Text>
                      <Text fontSize="xs" color="#6A6A6A">
                        {t("{{date}}", {
                          date: formatDate(blockMeta.blockTimestamp),
                        })}
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={0}>
                      <Text color={"green.500"}>{`+${t("{{value}} pts.", { value: "TBD" })}`}</Text>
                      <Text fontSize="xs" color="#6A6A6A">
                        {t("{{value}} pts in total.", { value: "TBD" })}
                      </Text>
                    </VStack>
                  </HStack>
                ))} */}
              </VStack>
            </VStack>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
