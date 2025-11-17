import { Button, Heading, Icon, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"
import NFTEarthIcon from "@/components/Icons/svg/nft-earth.svg"

interface GetFreeNFTModalProps {
  isOpen: boolean
  onClose: () => void
  onCtaClick: () => void
}
export const GetFreeNFTModal: React.FC<GetFreeNFTModalProps> = ({ isOpen, onClose, onCtaClick }) => {
  const { t } = useTranslation()

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} isCloseable showCloseButton={true} modalProps={{ size: "md" }}>
      <VStack align="stretch" gap={4} alignItems="center">
        <Icon boxSize={180} color="bg.inverted">
          <NFTEarthIcon />
        </Icon>
        <VStack align="stretch" gap={4}>
          <Heading alignSelf="center" size="xl">
            {t("Claim Your Free GM NFT")}
          </Heading>

          <Text color="fg.muted">
            {t(
              "Galaxy Member NFT unlocks extra features and boosts your rewards throughout the DAO. Earth is the starter tier, completely free. Upgrade anytime to unlock higher multipliers and even more perks.",
            )}
          </Text>
        </VStack>

        <SimpleGrid w="full" gap={2} columns={2} pt={4}>
          <Button variant="outline" w="full" py={6} onClick={onClose}>
            {t("Maybe later")}
          </Button>

          <Button size="lg" variant="primary" py={6} onClick={onCtaClick}>
            {t("Get free NFT")}
          </Button>
        </SimpleGrid>
      </VStack>
    </BaseModal>
  )
}
