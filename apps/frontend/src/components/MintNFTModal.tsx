import { Card, Dialog, Text, VStack, CloseButton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { NFTWithRings } from "./GmNFT/components/NFTwithRings"

import { useNFTImage } from "@/api/contracts/galaxyMember/hooks/useNFTImage"
import { CustomModalContent } from "@/components/CustomModalContent"
import { ShareButtons } from "@/components/ShareButtons"
import { notFoundImage } from "@/constants"

type Props = {
  isOpen: boolean
  onClose: () => void
  tokenID?: string
}
// TODO: check modal here
export const MintNFTModal = ({ isOpen, onClose, tokenID }: Props) => {
  const { imageData } = useNFTImage()
  const { t } = useTranslation()
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose} trapFocus={false} placement="center">
      <CustomModalContent w={"auto"} maxW="breakpoint-md">
        <Card.Root rounded={20}>
          <Card.Body>
            <Dialog.Content
              rounded="2xl"
              data-testid="gmnft-modal"
              bgGradient={"radial-gradient(76.36% 85.35% at 50.12% 27.48%, #304828 0%, #01091B 100%)"}>
              <Dialog.CloseTrigger color={"white"} asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
              <Dialog.Body
                display={"flex"}
                alignContent={"center"}
                alignItems={"center"}
                pt={{ base: 14, md: 20 }}
                px={{ base: 12, md: 20 }}>
                <VStack alignItems={"center"}>
                  <Text
                    alignSelf={"center"}
                    mb={{ base: 4, md: 8 }}
                    textAlign={"center"}
                    data-testid={"gmnft-token-id"}
                    color={"white"}
                    textStyle="3xl"
                    fontWeight="bold">
                    {t("VeBetter")} <br /> {t("Governance")}
                  </Text>

                  <NFTWithRings image={imageData?.image ?? notFoundImage} tokenID={tokenID} />
                  <Text
                    alignSelf={"center"}
                    mt={{ base: 4, md: 8 }}
                    textAlign={"center"}
                    data-testid={"gmnft-token-id"}
                    color={"white"}
                    textStyle="2xl"
                    fontWeight="semibold">
                    {"Earth"}
                  </Text>
                  <Text
                    alignSelf={"center"}
                    textAlign={"center"}
                    data-testid={"gmnft-token-id"}
                    color={"white"}
                    textStyle="md"
                    fontWeight="semibold">
                    {t("#")}
                    {tokenID}
                  </Text>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer justifyContent={"center"} pb={{ base: 14, md: 20 }}>
                <ShareButtons descriptionEncoded="As%20a%20Voter%20in%20VeBetter%2C%20I%E2%80%99ve%20just%20minted%20my%20GM%20Earth%20NFT.%20%F0%9F%8C%8D%0A%0AGet%20yours%20here%20%F0%9F%91%89%20%20https%3A%2F%2Fgovernance.vebetterdao.org%2F%0A%0A%23GalaxyMember%20%23VeBetter" />
              </Dialog.Footer>
            </Dialog.Content>
          </Card.Body>
        </Card.Root>
      </CustomModalContent>
    </Dialog.Root>
  )
}
