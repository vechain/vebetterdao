import { useIsAppUnendorsed, useAppEndorsementScore, useAppEndorsers } from "@/api"
import { useEndorsementInfos, useEndorsementHistory } from "@/hooks/useEndorsementData"
import { UserEndorsementInfo } from "./UserEndorsementInfo"

import dayjs from "dayjs"

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
  Heading,
  Flex,
  Stack,
  Avatar,
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

  const endorsementHistory = useEndorsementHistory(appId)
  const endorsersInfo = useEndorsementInfos(appId)

  const formatDate = (timestamp: number) => {
    return dayjs(timestamp * 1000).format("MMMM D, YYYY")
  }

  const truncateAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

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
        <ModalBody rounded={"md"} w={"full"} p={10}>
          <Stack direction={["column", "column", "row"]} w={"full"} alignItems={"stretch"} spacing={8}>
            <VStack flex={1} h="full" p={5}>
              <HStack w="full" justify="space-between">
                <VStack alignItems={"flex-start"}>
                  <Text>{t("Current score")}</Text>
                  <Heading>{endorsementScore}</Heading>
                </VStack>

                <VStack alignItems={"flex-start"}>
                  <Text>{t("Users endorsing")}</Text>
                  <Heading>{endorsers?.length}</Heading>
                </VStack>

                <VStack alignItems={"flex-start"}>
                  <Text>{t("Status")}</Text>
                  <Heading color={isUnendorsed ? "red" : "green"}>
                    {isUnendorsed ? t("Not endorsed") : t("Endorsed")}
                  </Heading>
                </VStack>
              </HStack>
              <VStack bg="#FAFAFA" justify={"space-between"} rounded={"16px"} p={2} w={"full"}>
                <Heading alignSelf="flex-start">{t("Endorsers")}</Heading>
                {endorsersInfo.map((endorser, index) => (
                  <HStack
                    key={index}
                    bg="white"
                    p={2}
                    borderRadius={"16px"}
                    boxShadow="sm"
                    w={"full"}
                    justify={"space-between"}>
                    <Avatar name="TBD" bg="gray.500"></Avatar>
                    <VStack align="start">
                      <Text>{truncateAddress(endorser.address)}</Text>
                      <Text>{t("Endorsing since {{date}}", { date: formatDate(endorser.timestamp) })}</Text>
                    </VStack>
                    <UserEndorsementInfo address={endorser.address} />
                  </HStack>
                ))}
              </VStack>
            </VStack>

            <VStack
              bg="#FAFAFA"
              flex={1}
              p={4}
              rounded={"16px"}
              h="full"
              justify={"space-between"}
              scrollBehavior={"auto"}>
              <Heading alignSelf={"flex-start"}>{t("Endorsement history")}</Heading>
              {endorsementHistory.map((blockMeta, index) => (
                <HStack
                  key={index}
                  p={2}
                  borderRadius={"16px"}
                  borderBottom={"1px solid #EFEFEF"}
                  w={"full"}
                  alignItems={"flex-start"}
                  justify={"space-between"}>
                  <VStack align="start" justifyContent={"flex-start"}>
                    <Text>{truncateAddress(blockMeta.txOrigin)}</Text>
                    <Text>
                      {t("{{date}}", {
                        date: formatDate(blockMeta.blockTimestamp),
                      })}
                    </Text>
                  </VStack>
                  <VStack align="end">
                    <Text color={"green.500"}>{`+${t("{{value}} pts.", { value: "TBD" })}`}</Text>
                    <Text>{t("{{value}} pts in total.", { value: "TBD" })}</Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
