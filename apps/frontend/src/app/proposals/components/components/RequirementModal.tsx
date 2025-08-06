import { BaseModal } from "@/components/BaseModal"
import {
  UseDisclosureProps,
  VStack,
  Text,
  Heading,
  Button,
  OrderedList,
  ListItem,
  Image,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"

type Props = {
  isOpen: UseDisclosureProps["isOpen"]
  onClose: UseDisclosureProps["onClose"]
  hasNft: boolean
}

export const RequirementModal = ({ isOpen, onClose, hasNft }: Props) => {
  const { t } = useTranslation()
  const modalIcon = useColorModeValue("/assets/icons/nft-earth-light.png", "/assets/icons/nft-earth-dark.png")

  return (
    <BaseModal isOpen={isOpen || false} onClose={onClose || (() => {})} showCloseButton={true}>
      <VStack align="stretch" spacing={4} alignItems="center">
        <Image src={modalIcon} alt="NFT Requirement icon" boxSize={180} />
        <VStack align="stretch" spacing={6}>
          <Heading alignSelf="center" fontSize="28px">
            {t("To apply for a proposal, you must")}
          </Heading>

          {!hasNft ? (
            <OrderedList spacing={2}>
              <ListItem>
                <Trans
                  i18nKey="Get a <b>Galaxy Member - Moon NFT</b>. You can upgrade your NFT to GM Moon NFT or buy it."
                  components={{ b: <Text as="span" fontWeight="bold" /> }}
                />
              </ListItem>
              <ListItem>
                <Trans
                  i18nKey="Create a discussion thread about your proposal on the <b>VeChain Discourse</b> forum at least 3 days before submitting it on VeBetterDAO."
                  components={{ b: <Text as="span" fontWeight="bold" /> }}
                />
              </ListItem>
            </OrderedList>
          ) : (
            <Trans
              i18nKey="Have a discussion about your proposal on the <b>VeChain Discourse</b> forum at least 3 days before submitting it on VeBetterDAO."
              components={{ b: <Text as="span" fontWeight="bold" /> }}
            />
          )}
        </VStack>
        <HStack w="full" h="full" justifyContent="center" pt={4}>
          <Button variant="secondary" w="full" py={6}>
            {t("Create Discourse")}
          </Button>

          <Button variant="primaryAction" w="full" py={6}>
            {!hasNft ? t("Get NFT") : t("Apply")}
          </Button>
        </HStack>
      </VStack>
    </BaseModal>
  )
}
