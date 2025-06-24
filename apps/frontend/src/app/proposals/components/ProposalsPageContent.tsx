import { ProposalState, useProposalClaimableUserDeposits } from "@/api"
import { ProposalInfoCard, JoinCommunity } from "@/components"
import { VStack, HStack, Heading, Box, Button, Show, Spinner, Text } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ClaimDeposits, CreateProposalCard, ProposalsFilters, NoProposalsCard } from "./components"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useFilteredProposals } from "../hooks/useFilteredProposals"
import { useProposalFilters } from "@/store"
import { buttonClickActions, ButtonClickProperties, buttonClicked } from "@/constants"
import { AnalyticsUtils } from "@/utils"

export const ProposalsPageContent = () => {
  const { account } = useWallet()
  const { open } = useWalletModal()
  const router = useRouter()
  const { t } = useTranslation()

  const { selectedFilter } = useProposalFilters()
  const { filteredProposals, isLoading } = useFilteredProposals(selectedFilter)

  const { data } = useProposalClaimableUserDeposits(account?.address ?? "")
  const claimableDeposits = data?.claimableDeposits ?? []
  const totalClaimableDeposits = data?.totalClaimableDeposits ?? BigInt(0)

  const onNewClick = useCallback(() => {
    if (!account?.address) {
      open()
      return
    }
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CREATE_PROPOSAL))
    router.push("/proposals/new")
  }, [account, open, router])

  //First active, then looking for support (pending + deposit not met), then upcoming (pending + deposit met)
  const sortedProposals = useMemo(() => {
    return filteredProposals.sort((a, b) => {
      const getPriority = (proposal: (typeof filteredProposals)[0]) => {
        if (proposal.state === ProposalState.Active) return 1
        if (proposal.state === ProposalState.Pending && !proposal.isDepositReached) return 2 // lookingForSupport
        if (proposal.state === ProposalState.Pending && proposal.isDepositReached) return 3 // upcoming
        return 4 // Everything else
      }

      return getPriority(a) - getPriority(b)
    })
  }, [filteredProposals])

  if (isLoading)
    return (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    )

  return (
    <VStack w={"full"} spacing={4}>
      <VStack w={"full"} alignContent={"flex-start"}>
        <HStack spacing={4} w="full" justify={"space-between"} alignItems={"center"} mb={2}>
          <Box>
            <HStack spacing={3} alignItems={"center"}>
              <Heading as="h1" size="xl">
                {t("Proposals")}
              </Heading>
            </HStack>
          </Box>
          <Show below="sm">
            {filteredProposals.length > 0 && (
              <Button onClick={onNewClick} variant={"primaryAction"}>
                {t("Create proposal")}
              </Button>
            )}
          </Show>
        </HStack>
      </VStack>
      <ProposalsFilters alignSelf={"flex-start"} w="full" />
      <Show below="sm">
        {totalClaimableDeposits > 0 && (
          <Box mb={2} mt={3}>
            <ClaimDeposits totalClaimableDeposits={totalClaimableDeposits} claimableDeposits={claimableDeposits} />
          </Box>
        )}
      </Show>
      <HStack w={"full"} gap={8} mt={3}>
        <VStack
          flex={{ base: undefined, md: 4.5 }}
          data-testid="proposals"
          alignSelf={"flex-start"}
          gap={4}
          w={{ base: "full", md: undefined }}>
          {sortedProposals.map(proposal => (
            <ProposalInfoCard
              key={proposal.proposalId}
              proposalId={proposal.proposalId}
              description={proposal.description}
              roundIdVoteStart={proposal.roundIdVoteStart}
            />
          ))}
          {sortedProposals.length === 0 && !isLoading && (
            <NoProposalsCard
              onClick={onNewClick}
              buttonText={t("Create proposal")}
              description={
                <Text fontSize={16} fontWeight={400} mt={2}>
                  {t("Have an idea for something that could improve the experience in VeBetterDAO? ")}{" "}
                  <b style={{ color: "contrast-fg-on-muted" }}>{t("Create a proposal")}</b>{" "}
                  {t("and let the community vote to make it happen!")}
                </Text>
              }
            />
          )}
        </VStack>
        <Show above="sm">
          <VStack flex={2} alignSelf="flex-start" spacing={6} position={"sticky"} top={24}>
            {totalClaimableDeposits > 0 && (
              <ClaimDeposits totalClaimableDeposits={totalClaimableDeposits} claimableDeposits={claimableDeposits} />
            )}
            {sortedProposals.length > 0 && <CreateProposalCard />}
            <JoinCommunity />
          </VStack>
        </Show>
      </HStack>
      <Show below="sm">
        <Box mt={2} w={"full"}>
          <JoinCommunity />
        </Box>
      </Show>
    </VStack>
  )
}
