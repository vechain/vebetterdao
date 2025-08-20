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
import { useCurrentAllocationsRoundId, useGetUserGMs, useGMRequiredByProposalType } from "@/api"
import { gmNfts } from "@/constants/gmNfts"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"

type Props = {
  isOpen: UseDisclosureProps["isOpen"]
  onClose: UseDisclosureProps["onClose"]
  hasNft: boolean
}

export const RequirementModal = ({ isOpen, onClose, hasNft }: Props) => {
  const { t } = useTranslation()
  const modalIcon = useColorModeValue("/assets/icons/nft-earth-light.png", "/assets/icons/nft-earth-dark.png")
  const { data: gmRequired } = useGMRequiredByProposalType()
  const { data: userGMs } = useGetUserGMs()
  const router = useRouter()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const userHasAnyGm = useMemo(() => {
    return !!userGMs?.length
  }, [userGMs])

  const userHighestGm = useMemo(() => {
    if (!userHasAnyGm) return null
    if (userGMs?.length === 1) return userGMs[0]
    return userGMs?.sort((a, b) => Number(a.tokenLevel) - Number(b.tokenLevel))[0]
  }, [userGMs, userHasAnyGm])

  const getNftOrApplyButtonText = useMemo(() => {
    if (hasNft) {
      return t("Apply")
    }
    if (!userHasAnyGm) {
      return t("Vote")
    }
    return t("Upgrade NFT")
  }, [userHasAnyGm, hasNft, t])

  const handleGetNftOrApply = useCallback(() => {
    if (!userHasAnyGm) {
      router.push(`/rounds/${currentRoundId}`)
    } else if (!hasNft) {
      router.push(`/galaxy-member/${userHighestGm?.tokenId}`)
    } else {
      router.push("/proposals/new")
    }
  }, [hasNft, router, userHasAnyGm, userHighestGm?.tokenId, currentRoundId])

  console.log("hasNft", hasNft)
  console.log("userHasAnyGm", userHasAnyGm)
  console.log("userHighestGm", userHighestGm)
  console.log("currentRoundId", currentRoundId)

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
                <Text fontSize="16px" fontWeight={400}>
                  <Trans
                    i18nKey="Get a <b>Galaxy Member - {{gmName}} NFT</b>. You can upgrade your NFT to GM {{gmName}} NFT or buy it."
                    values={{ gmName: gmNfts[Math.max(Number(gmRequired) - 1, 0)]?.name ?? "Moon" }}
                    components={{ b: <Text as="span" fontWeight="bold" /> }}
                  />
                </Text>
              </ListItem>
              <ListItem>
                <Trans
                  i18nKey="Create a discussion thread about your proposal on the <b>VeChain Discourse</b> forum at least 3 days before submitting it on VeBetterDAO."
                  components={{ b: <Text as="span" fontWeight="bold" /> }}
                />
              </ListItem>
            </OrderedList>
          ) : (
            <Text fontSize="16px" fontWeight={400}>
              <Trans
                i18nKey="Have a discussion about your proposal on the <b>VeChain Discourse</b> forum at least 3 days before submitting it on VeBetterDAO."
                components={{ b: <Text as="span" fontWeight="bold" /> }}
              />
            </Text>
          )}
        </VStack>
        <HStack w="full" h="full" justifyContent="center" pt={4}>
          <Button
            variant="secondary"
            w="full"
            py={6}
            onClick={() => window.open("https://vechain.discourse.group", "_blank")}>
            {t("Create Discourse")}
          </Button>

          <Button variant="primaryAction" w="full" py={6} onClick={handleGetNftOrApply}>
            {getNftOrApplyButtonText}
          </Button>
        </HStack>
      </VStack>
    </BaseModal>
  )
}
