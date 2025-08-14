import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { CustomModalContent } from "@/components"
import {
  Button,
  Image,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalHeader,
  Heading,
  ModalBody,
  Text,
  ModalFooter,
  VStack,
  Stack,
  OrderedList,
  ListItem,
} from "@chakra-ui/react"

interface GetFreeNFTModalProps {
  isOpen: boolean
  onClose: () => void
  onCtaClick: () => void
}

export const GetFreeNFTModal: React.FC<GetFreeNFTModalProps> = ({ isOpen, onClose, onCtaClick }) => {
  const { t } = useTranslation()

  const listItems = [
    t("Complete 3 sustainable actions before the snapshot."),
    t("Swap B3TR for VOT3 tokens so you’re ready to vote."),
    t("Vote in an allocation or proposal round."),
    t("Mint your free GM Earth NFT after voting."),
  ] as string[]

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size={"2xl"}>
      <ModalOverlay />
      <CustomModalContent gap={4} p={{ base: 3, md: 5 }}>
        <ModalCloseButton />
        <ModalHeader>
          <VStack gap={4} align="flex-start">
            <Image src="/assets/icons/nft-earth-dark.png" alt="NFT Earth Illustration" boxSize="80px" />
            <Heading fontSize="2xl">{t("Get Galaxy Member - Earth NFT")}</Heading>
          </VStack>
        </ModalHeader>
        <ModalBody gap={[0, 4]} pt={0}>
          <Text fontSize={["16px"]}>
            {t(
              "A GM Earth NFT is your entry pass into DAO governance and rewards. It gives you access to extra features, and you can later upgrade it to boost your rewards with multipliers.",
            )}
          </Text>
          <br />
          <Text fontSize={["16px"]} fontWeight={700}>
            {t("How to Get One (Free):")}
          </Text>
          <OrderedList>
            {listItems.map((item, index) => (
              <ListItem key={`get-free-nft-${index}`}>{item}</ListItem>
            ))}
          </OrderedList>
          <Text fontSize={["16px"]}>
            {t("Once minted, you can keep it as-is or upgrade it (paid) to unlock other DAO features.")}
          </Text>
        </ModalBody>

        <ModalFooter w="full" px={4} pt={1}>
          <Stack direction={["column", "row"]} align="stretch" w="full">
            <Button variant={"whiteAction"} color={"#004CFC"} w={"full"} onClick={handleClose}>
              {t("Maybe later")}
            </Button>
            <Button variant={"primaryAction"} w={"full"} onClick={onCtaClick}>
              {t("Get free NFT")}
            </Button>
          </Stack>
        </ModalFooter>
      </CustomModalContent>
    </Modal>
  )
}
