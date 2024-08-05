import { useProposalClaimableUserDeposits } from "@/api"
import { ProposalInfoCard, JoinCommunity } from "@/components"
import { VStack, HStack, Heading, Box, Button, Show, Spinner } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ClaimDeposits, CreateProposalCard, ProposalsFilters, NoProposalsCard } from "./components"
import { useWallet, useWalletModal } from "@vechain/dapp-kit-react"
import { useFilteredProposals } from "../hooks/useFilteredProposals"

export const ProposalsPageContent = () => {
  const { account } = useWallet()
  const { open } = useWalletModal()
  const router = useRouter()
  const { t } = useTranslation()

  const { filteredProposals, isLoading } = useFilteredProposals()

  const userProposalDeposits = useProposalClaimableUserDeposits(account ?? "")

  const userTotalDeposits = useMemo(() => {
    return userProposalDeposits.reduce((acc, deposit) => {
      return BigInt(acc) + BigInt(deposit.data?.deposit ?? 0)
    }, BigInt(0))
  }, [userProposalDeposits])

  const onNewCLick = useCallback(() => {
    if (!account) {
      open()
      return
    }

    router.push("/proposals/new")
  }, [account, open, router])

  if (isLoading)
    return (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    )

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
            {filteredProposals.length > 0 && (
              <Button onClick={onNewCLick} variant={"primaryAction"}>
                {t("Create proposal")}
              </Button>
            )}
          </Show>
        </HStack>
      </VStack>
      <ProposalsFilters alignSelf={"flex-start"} w="full" />
      <Show below="sm">
        {userTotalDeposits > 0 && (
          <Box mb={2} mt={3}>
            <ClaimDeposits claimableDeposits={userTotalDeposits} userProposalDeposits={userProposalDeposits} />
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
          {filteredProposals.map(proposal => (
            <ProposalInfoCard proposal={proposal} key={proposal.proposalId} />
          ))}
          {filteredProposals.length === 0 && !isLoading && <NoProposalsCard />}
        </VStack>
        <Show above="sm">
          <VStack flex={2} alignSelf="flex-start" spacing={6} position={"sticky"} top={24}>
            {userTotalDeposits > 0 && (
              <ClaimDeposits claimableDeposits={userTotalDeposits} userProposalDeposits={userProposalDeposits} />
            )}
            {filteredProposals.length > 0 && <CreateProposalCard />}
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
