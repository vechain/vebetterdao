import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Stack,
  VStack,
  Text,
  Link,
  Image,
  Box,
} from "@chakra-ui/react"
import { t } from "i18next"
import { Trans } from "react-i18next"

const LINK_TO_DOCS = "https://docs.vebetterdao.org/vebetterdao/b3tr-and-vot3-tokens"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const CountdownModal = ({ isOpen, onClose }: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={"xl"}>
      <ModalOverlay />
      <ModalContent rounded={"20px"}>
        <ModalHeader>{t("How to VOT3?")}</ModalHeader>
        <ModalCloseButton />
        <ModalBody alignItems={"center"}>
          <VStack alignItems={"center"} spacing={8}>
            <Stack
              w={"full"}
              h={"full"}
              justifyContent={"space-between"}
              alignItems={"flex-start"}
              direction={["column", "column", "row", "row"]}
              gap={[2, 2, 4]}>
              <VStack
                w="full"
                h="full"
                alignItems={"center"}
                justifyContent="space-between"
                p={2}
                _hover={{
                  border: "1px solid #004cfc",
                  transform: "scale(1.02)",
                  transition: "all 0.2s ease-in-out",
                }}
                bg={"#f7f7f7"}
                borderRadius={"9px"}>
                <Box boxSize={"150px"} p={2}>
                  <Image src="/images/b3tr-to-vot3.svg" alt="B3TR to VOT3" />
                </Box>
                <Box w="full" h="full" p={2}>
                  <Trans
                    textAlign={"center"}
                    i18nKey="<bold>Convert</bold> your B3TR to VOT3"
                    components={{
                      bold: <Text as="span" fontWeight={"800"} />,
                    }}
                    t={t}
                  />
                </Box>
              </VStack>

              <VStack
                w="full"
                h="full"
                alignItems={"center"}
                justifyContent="space-between"
                p={2}
                _hover={{
                  border: "1px solid #004cfc",
                  transform: "scale(1.02)",
                  transition: "all 0.2s ease-in-out",
                }}
                bg={"#f7f7f7"}
                borderRadius={"9px"}>
                <Box boxSize={"150px"} p={2}>
                  <Image boxSize={"100px"} src="/images/vote-icon.png" alt="Cast your vote" />
                </Box>

                <Box justifyContent={"center"} w="full" h="full" p={2}>
                  <Trans
                    textAlign={"center"}
                    i18nKey="<bold>Cast</bold> your vote to your favorite app"
                    components={{
                      bold: <Text as="span" fontWeight={"800"} />,
                    }}
                    t={t}
                  />
                </Box>
              </VStack>

              <VStack
                w="full"
                h="full"
                alignItems={"center"}
                justifyContent="space-between"
                p={2}
                _hover={{
                  border: "1px solid #004cfc",
                  transform: "scale(1.02)",
                  transition: "all 0.2s ease-in-out",
                }}
                bg={"#f7f7f7"}
                borderRadius={"9px"}>
                <Box boxSize={"150px"} p={2}>
                  <Image src="/images/claim-b3tr-icon.png" alt="Receive your rewards" />
                </Box>
                <Box justifyContent={"center"} p={2}>
                  <Trans
                    textAlign={"center"}
                    i18nKey="<bold>Claim</bold> your rewards"
                    components={{
                      bold: <Text as="span" fontWeight={"800"} />,
                    }}
                    t={t}
                  />
                </Box>
              </VStack>
            </Stack>

            <Link fontWeight="bold" cursor={"pointer"} href={LINK_TO_DOCS} target="_blank ">
              {t("Learn more")}
            </Link>
          </VStack>
        </ModalBody>
        <ModalFooter></ModalFooter>
      </ModalContent>
    </Modal>
  )
}
