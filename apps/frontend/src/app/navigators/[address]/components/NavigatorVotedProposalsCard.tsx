import { Badge, Button, Card, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import {
  mapSupportToVoteType,
  useUserProposalsVoteEvents,
} from "@/api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { useUserVotedProposals } from "@/api/contracts/governance/hooks/useUserVotedProposals"
import { ProposalBox } from "@/app/profile/components/ProfileGovernance/components/ProposalBox"
import VoteIcon from "@/components/Icons/svg/vote.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { VoteType } from "@/types/voting"

import { NavigatorProposalsModal } from "./modals/NavigatorProposalsModal"

const PREVIEW_COUNT = 3

type Props = {
  address: string
}

export const NavigatorVotedProposalsCard = ({ address }: Props) => {
  const { t } = useTranslation()
  const { data: votedProposals } = useUserProposalsVoteEvents(address)
  const votedProposalsIds = useMemo(() => votedProposals?.map(p => p.proposalId.toString()), [votedProposals])
  const votedProposalsRaw = useUserVotedProposals(votedProposalsIds)
  const votedProposalsWithDescription = useMemo(
    () => votedProposalsRaw?.slice().sort((a, b) => Number(b.id) - Number(a.id)),
    [votedProposalsRaw],
  )

  const voteTypes = useMemo(() => {
    if (!votedProposals) return undefined
    const map: Record<string, VoteType> = {}
    for (const event of votedProposals) {
      const voteType = mapSupportToVoteType(event.support)
      if (voteType) map[event.proposalId.toString()] = voteType
    }
    return map
  }, [votedProposals])

  const [isModalOpen, setIsModalOpen] = useState(false)

  if (votedProposalsWithDescription && votedProposalsWithDescription.length > 0) {
    return (
      <>
        <Card.Root w="full" variant="primary" h="full">
          <Card.Body>
            <HStack w="full" justify="space-between" align="center" mb={{ base: 2, md: 4 }}>
              <HStack gap={2} align="center">
                <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
                  {t("Voted proposals")}
                </Text>
                <Badge variant="neutral" size="sm" rounded="sm">
                  {votedProposalsWithDescription.length}
                </Badge>
              </HStack>
              {votedProposalsWithDescription.length > PREVIEW_COUNT && (
                <Button variant="ghost" size="sm" fontWeight="semibold" onClick={() => setIsModalOpen(true)}>
                  {t("View all")}
                  <FiArrowUpRight size={16} />
                </Button>
              )}
            </HStack>
            <VStack w="full" gap={3}>
              {votedProposalsWithDescription.slice(0, PREVIEW_COUNT).map(proposal => (
                <ProposalBox
                  key={proposal.id}
                  proposalId={proposal.id}
                  metadata={{
                    title: proposal.title,
                    shortDescription: proposal.description,
                    markdownDescription: proposal.markdownDescription,
                  }}
                  voteType={voteTypes?.[proposal.id]}
                />
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>

        <NavigatorProposalsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={t("Voted Proposals")}
          description={t("All governance proposals this navigator has voted on.")}
          proposals={votedProposalsWithDescription}
          voteTypes={voteTypes}
        />
      </>
    )
  }

  return (
    <Card.Root variant="primary" w="full" h="full">
      <Card.Body asChild>
        <EmptyState
          title={t("Voted Proposals")}
          description={t("{{subject}} voted proposals will appear here.", {
            subject: `${humanAddress(address, 4, 3)}`,
          })}
          icon={
            <Icon boxSize={20} color="actions.secondary.text-lighter">
              <VoteIcon color="rgba(117, 117, 117, 1)" />
            </Icon>
          }
        />
      </Card.Body>
    </Card.Root>
  )
}
