import { useCurrentAllocationsRoundId, useGetUserGMs, useGMRequiredByProposalType } from "@/api"
import { BaseModal } from "@/components/BaseModal"
import NFTEarthIcon from "@/components/Icons/svg/nft-earth.svg"
import { gmNfts } from "@/constants/gmNfts"
import { Button, Heading, Icon, List, SimpleGrid, Text, UseDisclosureProps, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"

type Props = {
  isOpen: UseDisclosureProps["open"]
  onClose: UseDisclosureProps["onClose"]
  hasNft: boolean
  isGrants?: boolean
}

export const RequirementModal = ({ isOpen = false, onClose = () => {}, hasNft, isGrants }: Props) => {
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
          <NFTEarthIcon />
        </Icon>
        <VStack align="stretch" gap={6}>
          <Heading alignSelf="center" fontSize="28px">
            {isGrants ? t("To apply for a grant, you must") : t("To apply for a proposal, you must")}
          </Heading>

          {!hasNft ? (
            <List.Root as="ol" gap={2}>
              <List.Item>
                <Text fontWeight={400}>
                  <Trans
                    i18nKey="Get a <b>Galaxy Member - {{gmName}} NFT</b>. You can upgrade your NFT to GM {{gmName}} NFT or buy it."
                    values={{ gmName: gmNfts[Math.max(Number(gmRequired) - 1, 0)]?.name ?? "Moon" }}
                    components={{ b: <Text as="span" fontWeight="bold" /> }}
                  />
                </Text>
              </List.Item>
              {!isGrants && (
                <List.Item>
                  <Text>
                    <Trans
                      i18nKey="Create a discussion thread about your proposal on the <b>VeChain Discourse</b> forum at least 3 days before submitting it on VeBetterDAO."
                      components={{ b: <Text as="span" fontWeight="bold" /> }}
                    />
                  </Text>
                </List.Item>
              )}
            </List.Root>
          ) : (
            <Text fontWeight={400}>
              <Trans
                i18nKey="Have a discussion about your proposal on the <b>VeChain Discourse</b> forum at least 3 days before submitting it on VeBetterDAO."
                components={{ b: <Text as="span" fontWeight="bold" /> }}
              />
            </Text>
          )}
        </VStack>

        <SimpleGrid w="full" gap={2} columns={isGrants ? 1 : 2} pt={4}>
          {!isGrants && (
            <Button
              variant="secondary"
              w="full"
              py={6}
              onClick={() => window.open("https://vechain.discourse.group", "_blank")}>
              {t("Create Discourse")}
            </Button>
          )}

          <Button size="lg" variant="primaryAction" py={6} onClick={handleGetNftOrApply}>
            {getNftOrApplyButtonText}
          </Button>
        </SimpleGrid>
      </VStack>
    </BaseModal>
  )
}
