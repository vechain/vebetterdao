"use client"

import { Grid, GridItem, HStack, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { HowToSupportCard } from "../../components"
import { GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { ConvertModal, SearchField } from "@/components"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { useDebounce, useProposalSearch } from "@/hooks"
import { useMemo, useState } from "react"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"

import { GrantsProposalCard } from "../components/GrantsProposalCard"
import { useWallet } from "@vechain/vechain-kit"
import { EmptyState } from "@/components/ui/empty-state"
import { compareAddresses } from "@repo/utils/AddressUtils"

const BreadcrumItems = [
  {
    label: "Grants",
    href: "/proposals/grants",
  },
  {
    label: "My grants",
    href: "/proposals/grants/manage",
  },
]

// type GrantProposalEditCardProps = {
//   mode: "read" | "edit"
//   proposal: GrantProposalEnriched
// }

// const GrantProposalCard = ({ mode, proposal }: GrantProposalEditCardProps) => {
//   const { t } = useTranslation()

//   const timeLeftDisplay = "10 days"

//   return (
//     <LinkBox>
//       <LinkOverlay asChild href="/proposals/grants/manage/1">
//         <Card.Root p="8" gap="8" divideY="1px" divideColor="border.secondary">
//           <Card.Header gap="4" p="0">
//             <Card.Title>{proposal.title}</Card.Title>
//             <HStack divideX="1px" divideColor="border.secondary" gap="4">
//               <Text>{t("Status")}</Text>
//               <Text>{t("Status")}</Text>
//             </HStack>
//           </Card.Header>

//           <Card.Footer asChild p="0" pt="6" alignItems={{ base: "flex-start", md: "center" }}>
//             {mode === "edit" ? (
//               <ButtonGroup>
//                 <Button variant="primaryAction" size="md">
//                   {t("Edit")}
//                 </Button>
//                 <Button variant="primaryAction" size="md">
//                   {t("Delete")}
//                 </Button>
//               </ButtonGroup>
//             ) : (
//               <HStack justifyContent="space-between">
//                 <SimpleGrid columns={{ base: 1, md: 2 }} gap="4" alignItems={{ base: "flex-start", md: "center" }}>
//                   <GrantsProposalStatusBadge state={proposal.state} />
//                   {timeLeftDisplay ? (
//                     <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
//                       {t("Ends: {{endDate}}", { endDate: timeLeftDisplay })}
//                     </Text>
//                   ) : null}
//                 </SimpleGrid>

//                 <ProposalCommunityInteractions
//                   proposalId={proposal.id}
//                   state={proposal.state}
//                   depositPercentage={communityDepositPercentage}
//                   votesFor={proposalVotes?.votes?.for?.percentagePower}
//                   votesAgainst={proposalVotes?.votes?.against?.percentagePower}
//                   votesAbstain={proposalVotes?.votes?.abstain?.percentagePower}
//                   hasUserDeposited={hasUserDeposited}
//                   userVoteOption={userVoteOption}
//                 />
//               </HStack>
//             )}
//           </Card.Footer>
//         </Card.Root>
//       </LinkOverlay>
//     </LinkBox>
//   )
// }

export default function GrantsNew() {
  const { account } = useWallet()
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpenConvertModal, setIsOpenConvertModal] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data: { enrichedGrantProposals } = { enrichedGrantProposals: [] as GrantProposalEnriched[] } } =
    useProposalEnriched()
  const searchedProposals = useProposalSearch(enrichedGrantProposals, debouncedSearchTerm)

  const usersGrants = useMemo(() => {
    return searchedProposals.filter(proposal => compareAddresses(proposal.proposerAddress, account?.address))
  }, [searchedProposals, account?.address])

  const anyGrantExists = useMemo(() => {
    return usersGrants && usersGrants.length > 0
  }, [usersGrants])

  return (
    <>
      <Grid alignItems="flex-start" w={"full"} gap={4} templateColumns={{ base: "1fr", md: "2fr 1fr" }}>
        <GridItem display="flex" flexDirection="column" gap="4">
          <HStack justifyContent="space-between">
            <PageBreadcrumb items={BreadcrumItems} />
            {anyGrantExists && (
              <Button variant="primaryAction" size="md">
                {t("Apply for grant")}
              </Button>
            )}
          </HStack>

          <SearchField
            inputProps={{ minW: "200px", flex: 1 }}
            placeholder={t("Search by grant name")}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </GridItem>
        <GridItem />

        <GridItem display="flex" flexDirection="column" gap="6">
          {anyGrantExists ? (
            usersGrants?.map(proposal => (
              <GrantsProposalCard
                key={proposal.id}
                proposal={proposal as GrantProposalEnriched & { isDepositReached: boolean }}
              />
            ))
          ) : (
            <EmptyState title={t("No grants proposal found")}>
              <Button variant="primaryAction" size="md">
                {t("Apply for grant")}
              </Button>
            </EmptyState>
          )}
        </GridItem>
        <GridItem>
          <HowToSupportCard onOpenConvertModal={() => setIsOpenConvertModal(true)} />
        </GridItem>
      </Grid>
      {/* Convert/Swap Modal */}
      <ConvertModal isOpen={isOpenConvertModal} onClose={() => setIsOpenConvertModal(false)} />
    </>
  )
}
