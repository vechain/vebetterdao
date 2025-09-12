import { BaseModal } from "@/components/BaseModal"
import { UseDisclosureProps, VStack, Text, Heading, Button, List, Icon, SimpleGrid } from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"
import { useCurrentAllocationsRoundId, useGetUserGMs, useGMRequiredByProposalType } from "@/api"
import { gmNfts } from "@/constants/gmNfts"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import NftEarthIcon from "@/components/Icons/svg/nft-earth.svg"

type Props = {
  isOpen: UseDisclosureProps["open"]
  onClose: UseDisclosureProps["onClose"]
  hasNft: boolean
}

export const RequirementModal = ({ isOpen = false, onClose = () => {}, hasNft }: Props) => {
  const { t } = useTranslation()

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

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton={true} modalProps={{ size: "md" }}>
      <VStack align="stretch" gap={4} alignItems="center">
        <Icon boxSize={180} color="bg.inverted">
          <NftEarthIcon />
        </Icon>
        <VStack align="stretch" gap={6}>
          <Heading alignSelf="center" size="3xl">
            {t("To apply for a proposal, you must")}
          </Heading>

          {!hasNft ? (
            <List.Root as="ol" gap={2}>
              <List.Item>
                <Text textStyle="md">
                  <Trans
                    i18nKey="Get a <b>Galaxy Member - {{gmName}} NFT</b>. You can upgrade your NFT to GM {{gmName}} NFT or buy it."
                    values={{ gmName: gmNfts[Math.max(Number(gmRequired) - 1, 0)]?.name ?? "Moon" }}
                    components={{ b: <Text as="span" /> }}
                  />
                </Text>
              </List.Item>
              <List.Item>
                <Trans
                  i18nKey="Create a discussion thread about your proposal on the <b>VeChain Discourse</b> forum at least 3 days before submitting it on VeBetterDAO."
                  components={{ b: <Text as="span" /> }}
                />
              </List.Item>
            </List.Root>
          ) : (
            <Text textStyle="md">
              <Trans
                i18nKey="Have a discussion about your proposal on the <b>VeChain Discourse</b> forum at least 3 days before submitting it on VeBetterDAO."
                components={{ b: <Text as="span" /> }}
              />
            </Text>
          )}
        </VStack>

        <SimpleGrid w="full" gap={2} columns={2} pt={4}>
          <Button
            size="lg"
            variant="secondary"
            py={6}
            onClick={() => window.open("https://vechain.discourse.group", "_blank")}>
            {t("Create Discourse")}
          </Button>

          <Button size="lg" variant="primary" py={6} onClick={handleGetNftOrApply}>
            {getNftOrApplyButtonText}
          </Button>
        </SimpleGrid>
      </VStack>
    </BaseModal>
  )
}
