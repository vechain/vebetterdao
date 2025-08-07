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
import { useGMRequiredByProposalType } from "@/api"
import { gmNfts } from "@/constants/gmNfts"
import { useRouter } from "next/navigation"

type Props = {
  isOpen: UseDisclosureProps["isOpen"]
  onClose: UseDisclosureProps["onClose"]
  hasNft: boolean
}

export const RequirementModal = ({ isOpen, onClose, hasNft }: Props) => {
  const { t } = useTranslation()
  const modalIcon = useColorModeValue("/assets/icons/nft-earth-light.png", "/assets/icons/nft-earth-dark.png")
  const { data: gmRequired } = useGMRequiredByProposalType()
  const router = useRouter()
  const handleGetNftOrApply = () => {
    if (!hasNft) {
      router.push("/profile?tab=gm")
    } else {
      router.push("/proposals/new")
    }
  }

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
                  i18nKey="Get a <b>Galaxy Member - {{gmName}} NFT</b>. You can upgrade your NFT to GM {{gmName}} NFT or buy it."
                  values={{ gmName: gmNfts[Number(gmRequired)]?.name ?? "Moon" }}
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

          <Button variant="primaryAction" w="full" py={6} onClick={handleGetNftOrApply}>
            {!hasNft ? t("Get NFT") : t("Apply")}
          </Button>
        </HStack>
      </VStack>
    </BaseModal>
  )
}
