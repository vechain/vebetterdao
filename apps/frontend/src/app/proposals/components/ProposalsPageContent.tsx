import {
  useProposalsEvents,
  useActiveProposals,
  useIncomingProposals,
  usePastProposals,
  useProposalClaimableUserDeposits,
} from "@/api"
import { ProposalInfoCard } from "@/components"
import { VStack, HStack, Heading, Box, Button, Show } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ClaimDeposits, CreateProposalCard, Filter, NoProposalsCard } from "./components"
import { useWallet } from "@vechain/dapp-kit-react"

export const ProposalsPageContent = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { data: proposalsEvents, error: proposalsEventsError, isLoading: proposalsEventsLoading } = useProposalsEvents()
  const { data: activeProposals, error: activeProposalsError, isLoading: activeProposalsLoading } = useActiveProposals()
  const {
    data: incomingProposals,
    error: incomingProposalsError,
    isLoading: incomingProposalsLoading,
  } = useIncomingProposals()
  const { data: pastProposals, error: pastProposalsError, isLoading: pastProposalsLoading } = usePastProposals()
  const { account } = useWallet()

  const allProposals = useMemo(() => {
    if (!proposalsEvents) return []

    const sortedProposals = proposalsEvents.created.sort((a, b) => {
      return Number(b.roundIdVoteStart) - Number(a.roundIdVoteStart)
    })

    return sortedProposals
  }, [proposalsEvents])

  const userProposalDeposits = useProposalClaimableUserDeposits(allProposals, account ?? "")

  const userTotalDeposits = useMemo(() => {
    return userProposalDeposits.reduce((acc, deposit) => {
      return BigInt(acc) + BigInt(deposit.data?.deposit ?? 0)
    }, BigInt(0))
  }, [userProposalDeposits])

  console.log({ userProposalDeposits, userTotalDeposits })

  console.log({ proposals: proposalsEvents?.created })

  const onNewCLick = useCallback(() => {
    router.push("/proposals/new")
  }, [router])

  return (
    <VStack w={"full"}>
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
            {allProposals.length > 0 && (
              <Button onClick={onNewCLick} variant={"primaryAction"}>
                {t("Create proposal")}
              </Button>
            )}
          </Show>
        </HStack>
      </VStack>
      <Show below="sm">
        {userTotalDeposits > 0 && (
          <Box mb={2} mt={3}>
            <ClaimDeposits claimableDeposits={userTotalDeposits} userProposalDeposits={userProposalDeposits} />
          </Box>
        )}
      </Show>
      <HStack w={"full"} gap={8} mt={3}>
        <VStack flex={allProposals.length !== 0 ? 4.5 : 7} data-testid="proposals" alignSelf={"flex-start"} gap={4}>
          {allProposals.map(proposal => (
            <ProposalInfoCard proposal={proposal} key={proposal.proposalId} />
          ))}
          {allProposals.length === 0 && <NoProposalsCard />}
        </VStack>
        <Show above="sm">
          <VStack flex={2} alignSelf="flex-start" spacing={6}>
            {userTotalDeposits > 0 && (
              <ClaimDeposits claimableDeposits={userTotalDeposits} userProposalDeposits={userProposalDeposits} />
            )}
            {allProposals.length > 0 && <CreateProposalCard />}
          </VStack>
        </Show>
      </HStack>
    </VStack>
  )
}
