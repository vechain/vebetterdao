import {
  Modal,
  ModalOverlay,
  ModalContent,
  Heading,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Text,
  Image,
  Box,
  Button,
} from "@chakra-ui/react"
import { t } from "i18next"
import { Countdown } from "./Countdown"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const SnapshotExplainationModal = ({ isOpen, onClose }: Props) => {
  const LINK_TO_DOCS = () => {
    window.open("https://docs.vebetterdao.org/vebetterdao/b3tr-and-vot3-tokens", "_blank")
  }

  const renderStep = (step: number) => (
    <Text fontSize={10} textColor={"#6A6A6A"}>
      {t("STEP {{value}}", { value: step })}
    </Text>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={"xl"}>
      <ModalOverlay />
      <ModalContent rounded={"20px"} pt={10} px={3}>
        <VStack px={5} alignItems={"start"} spacing={6}>
          <Countdown onOpen={onClose} />
          <Heading size={"xl"}>{t("What is a snapshot ?")}</Heading>
        </VStack>

        <ModalCloseButton py={10} />
        <ModalBody alignItems={"center"}>
          <VStack alignItems={"center"} spacing={8}>
            <Text>
              {t(
                "When a voting rounds begin, a record of the total supply of VOT3 tokens and each holder’s balance is taken to calculate individual voting power.",
              )}
            </Text>
            <Text>{t("Swap your B3TR for VOT3 before the snapshot to increase your voting power.")}</Text>

            <VStack w={"full"} h={"full"} justifyContent={"space-between"} alignItems={"flex-start"} gap={[2, 2, 4]}>
              <HStack w="full" justifyContent="start" p={2} bg={"#f7f7f7"} borderRadius={"9px"}>
                <Box boxSize={"100px"} alignItems={"start"}>
                  <Image boxSize={"90px"} src="/images/b3tr-to-vot3.svg" alt="B3TR to VOT3" />
                </Box>
                <VStack gap={0} alignItems={"start"} p={1}>
                  {renderStep(1)}
                  <Text fontSize={16} fontWeight={700}>
                    {t("Convert your B3TR to VOT3")}
                  </Text>
                </VStack>
              </HStack>

              <HStack w="full" h="full" justifyContent="start" p={2} bg={"#f7f7f7"} borderRadius={"9px"}>
                <Box boxSize={"100px"} alignItems={"center"}>
                  <Image boxSize={"90px"} src="/images/vote-icon.png" alt="Cast your vote" />
                </Box>
                <VStack gap={0} alignItems={"start"} p={1}>
                  {renderStep(2)}
                  <Text fontSize={16} fontWeight={700}>
                    {t("Cast your vote to your favorite app")}
                  </Text>
                </VStack>
              </HStack>

              <HStack w="full" justifyContent="start" p={2} bg={"#f7f7f7"} borderRadius={"9px"}>
                <Box boxSize={"100px"} alignItems={"start"}>
                  <Image boxSize={"100px"} src="/images/claim-b3tr-icon.png" alt="Receive your rewards" />
                </Box>
                <VStack gap={0} alignItems={"start"} p={1}>
                  {renderStep(3)}
                  <Text fontSize={16} fontWeight={700}>
                    {t("Claim your rewards")}
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            <Button variant="primaryAction" w={"full"} onClick={LINK_TO_DOCS}>
              {t("Learn more")}
            </Button>
          </VStack>
        </ModalBody>
        <ModalFooter></ModalFooter>
      </ModalContent>
    </Modal>
  )
}
