import { useProposalClaimableUserDeposits } from "@/api"
import { JoinCommunity } from "@/components"
import { VStack, Box, Spinner, Text, useDisclosure, Card, Grid } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { RequirementModal, ClaimDeposits, CreateProposalCard, NoProposalsCard, ProposalFilters } from "./components"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useFilteredProposals } from "../hooks/useFilteredProposals"
import { useProposalFilters } from "@/store"
import { buttonClickActions, ButtonClickProperties, buttonClicked } from "@/constants"
import { AnalyticsUtils } from "@/utils"
import { useMetProposalCriteria } from "@/api/contracts/governance"
import { ProposalEnriched } from "@/hooks/proposals/grants/types"
import { useProposalEnriched } from "@/hooks/proposals/common"
import { GrantsProposalCard } from "@/app/grants/components"

export const ProposalsPageContent = () => {
  const { account } = useWallet()
  const { open } = useWalletModal()
  const { t } = useTranslation()
  const { open: isRequirementModalOpen, onOpen: openRequirementModal, onClose: closeRequirementModal } = useDisclosure()
  const { selectedFilter } = useProposalFilters()
  const { data: { enrichedStandardProposals } = { enrichedStandardProposals: [] } } = useProposalEnriched()
  const { filteredProposals, isLoading } = useFilteredProposals(selectedFilter, enrichedStandardProposals)
  const { data } = useProposalClaimableUserDeposits(account?.address ?? "")
  const claimableDeposits = data?.claimableDeposits ?? []
  const totalClaimableDeposits = data?.totalClaimableDeposits ?? BigInt(0)

  const { hasMetProposalCriteria } = useMetProposalCriteria()
  const onNewClick = useCallback(() => {
    if (!account?.address) {
      open()
      return
    }

    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CREATE_PROPOSAL))
    openRequirementModal()
  }, [account?.address, open, openRequirementModal])

  if (isLoading)
    return (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    )

  return (
    <>
      {totalClaimableDeposits > 0 && (
        <Box hideFrom="md">
          <ClaimDeposits totalClaimableDeposits={totalClaimableDeposits} claimableDeposits={claimableDeposits} />
        </Box>
      )}

      <Grid alignItems="flex-start" w={"full"} gap={4} templateColumns={{ base: "1fr", md: "2fr 1fr" }}>
        <Card.Root unstyled>
          <Card.Header
            w="full"
            display="flex"
            py="4"
            flexDirection="row"
            alignItems="flex-start"
            justifyContent="space-between">
            <Card.Title textStyle={{ base: "2xl", md: "3xl" }}> {t("Proposals")}</Card.Title>

            <ProposalFilters />
          </Card.Header>
          <Card.Body>
            <VStack
              flex={{ base: undefined, md: 4.5 }}
              data-testid="proposals"
              alignSelf={"flex-start"}
              gap={4}
              w={{ base: "full", md: undefined }}>
              {filteredProposals.map(proposal => (
                <GrantsProposalCard
                  key={proposal.id}
                  variant="proposal"
                  proposal={proposal as ProposalEnriched & { isDepositReached: boolean }}
                />
              ))}

              {filteredProposals.length === 0 && !isLoading && (
                <NoProposalsCard
                  onClick={onNewClick}
                  buttonText={t("Create proposal")}
                  description={
                    <Text fontSize={16} fontWeight={400} mt={2}>
                      {t("Have an idea for something that could improve the experience in VeBetter? ")}{" "}
                      <b style={{ color: "contrast-fg-on-muted" }}>{t("Create a proposal")}</b>{" "}
                      {t("and let the community vote to make it happen!")}
                    </Text>
                  }
                />
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        <VStack hideBelow="md" alignSelf="flex-start" gap={6} position={"sticky"} top={24}>
          {totalClaimableDeposits > 0 && (
            <ClaimDeposits totalClaimableDeposits={totalClaimableDeposits} claimableDeposits={claimableDeposits} />
          )}
          {filteredProposals.length > 0 && <CreateProposalCard />}
          <JoinCommunity />
        </VStack>

        <VStack hideFrom="md" mt={2} w={"full"}>
          {filteredProposals.length > 0 && <CreateProposalCard />}
          <JoinCommunity />
        </VStack>
        <RequirementModal
          isOpen={isRequirementModalOpen}
          onClose={closeRequirementModal}
          hasNft={hasMetProposalCriteria}
        />
      </Grid>
    </>
  )
}
