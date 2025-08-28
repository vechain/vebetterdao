import { useTranslation } from "react-i18next"
import { Dialog, Button, Image, Text, VStack, Stack, Heading, Box, Portal, CloseButton } from "@chakra-ui/react"

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

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} size={"2xl"}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <VStack gap={4} align="flex-start">
                <Image src="/assets/icons/nft-earth.svg" alt="NFT Earth Illustration" boxSize="80px" />
                <Heading textStyle="2xl">{t("Get Galaxy Member - Earth NFT")}</Heading>
              </VStack>
            </Dialog.Header>
            <Dialog.Body gap={[0, 4]} pt={0}>
              <Text fontSize={["16px"]}>
                {t(
                  "A GM Earth NFT is your entry pass into DAO governance and rewards. It gives you access to extra features, and you can later upgrade it to boost your rewards with multipliers.",
                )}
              </Text>
              <br />
              <Text fontSize={["16px"]}>{t("How to Get One (Free):")}</Text>
              <Box as="ol">
                {listItems.map((item, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={`get-free-nft-${index}`}>{item}</li>
                ))}
              </Box>
              <Text fontSize={["16px"]}>
                {t("Once minted, you can keep it as-is or upgrade it (paid) to unlock other DAO features.")}
              </Text>
            </Dialog.Body>

            <Dialog.Footer w="full" px={4} pt={1}>
              <Stack direction={["column", "row"]} align="stretch" w="full">
                <Button variant={"whiteAction"} color={"#004CFC"} w={"full"} onClick={onClose}>
                  {t("Maybe later")}
                </Button>
                <Button variant={"primaryAction"} w={"full"} onClick={onCtaClick}>
                  {t("Get free NFT")}
                </Button>
              </Stack>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
