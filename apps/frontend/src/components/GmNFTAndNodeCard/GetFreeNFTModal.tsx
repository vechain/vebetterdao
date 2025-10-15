import { Dialog, Button, Text, VStack, Heading, Box, Portal, CloseButton, SimpleGrid, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import NFTEarthIcon from "@/components/Icons/svg/nft-earth.svg"

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
                <Icon boxSize="80px" color="bg.inverted">
                  <NFTEarthIcon />
                </Icon>
                <Heading size="2xl">{t("Get Galaxy Member - Earth NFT")}</Heading>
              </VStack>
            </Dialog.Header>
            <Dialog.Body gap={[0, 4]} pt={0}>
              <Text textStyle="md">
                {t(
                  "A GM Earth NFT is your entry pass into DAO governance and rewards. It gives you access to extra features, and you can later upgrade it to boost your rewards with multipliers.",
                )}
              </Text>
              <br />
              <Text textStyle="md">{t("How to Get One (Free):")}</Text>
              <Box as="ol">
                {listItems.map((item, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={`get-free-nft-${index}`}>{item}</li>
                ))}
              </Box>
              <Text textStyle="md">
                {t("Once minted, you can keep it as-is or upgrade it (paid) to unlock other DAO features.")}
              </Text>
            </Dialog.Body>

            <Dialog.Footer w="full" px={4} pt={1}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={2} w="full">
                <Button variant="secondary" w={"full"} onClick={onClose}>
                  {t("Maybe later")}
                </Button>
                <Button variant={"primary"} w={"full"} onClick={onCtaClick}>
                  {t("Get free NFT")}
                </Button>
              </SimpleGrid>
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
