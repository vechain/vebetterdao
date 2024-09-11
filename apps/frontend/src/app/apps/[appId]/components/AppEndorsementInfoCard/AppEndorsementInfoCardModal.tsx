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
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  isOpen: boolean
  onClose: () => void
  listOfEndorsements: { name: string; date: string; points: number; address: string }[]
  XApps: { scoreTotal: number }[]
}

export const AppEndorsementInfoCardModal = ({ isOpen, onClose, listOfEndorsements, XApps }: Props) => {
  const { t } = useTranslation()
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
                  <Heading></Heading>
                </VStack>

                <VStack alignItems={"flex-start"}>
                  <Text>{t("Users endorsing")}</Text>
                  <Heading></Heading>
                </VStack>

                <VStack alignItems={"flex-start"}>
                  <Text>{t("Status")}</Text>
                  <Heading></Heading>
                </VStack>
              </HStack>

              <VStack bg="#FAFAFA" justify={"space-between"} rounded={"16px"} p={2} w={"full"}>
                <Heading alignSelf="flex-start">{t("Endorsers")}</Heading>
                {listOfEndorsements.map((endorser, index) => (
                  <HStack key={index} bg="white" p={2} borderRadius={"16px"} boxShadow="sm" w={"full"}>
                    <Text>{endorser.name}</Text>
                    <VStack align="start">
                      <Text>{endorser.name}</Text>
                      <Text>
                        {t("Endorsing since")} {endorser.date}
                      </Text>
                    </VStack>
                    <Text>{t("{{value}} pts.", { value: endorser.points })}</Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>

            <VStack bg="#FAFAFA" flex={1} p={4} rounded={"16px"} h="full">
              <Heading alignSelf={"flex-start"}>{t("Endorsement history")}</Heading>
              {listOfEndorsements.map((endorser, index) => (
                <HStack
                  key={index}
                  p={2}
                  borderRadius={"16px"}
                  borderBottom={"1px solid #EFEFEF"}
                  w={"full"}
                  justify={"space-between"}>
                  <VStack>
                    <Text>{endorser.address}</Text>
                    <Text> {endorser.date}</Text>
                  </VStack>
                  <VStack align="start">
                    {t("{{value}} pts.", { value: endorser.points })}

                    <Text color={endorser.points > 0 ? "green.500" : "red.500"}>
                      {endorser.points > 0
                        ? `+${t("{{value}} pts.", { value: endorser.points })}`
                        : `-${t("{{value}} pts.", { value: endorser.points })}`}
                    </Text>
                    <Text> {t("{{value}} pts in total.", { value: XApps[0]?.scoreTotal })}</Text>
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
