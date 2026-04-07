import { Badge, Card, HStack, Icon, LinkBox, LinkOverlay, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { IoIosArrowForward } from "react-icons/io"

import { useProposalState } from "../../../../../api/contracts/governance/hooks/useProposalState"
import { ProposalMetadata } from "../../../../../api/contracts/governance/types"
import { ProposalStatusBadge } from "../../../../../components/Proposal/ProposalStatusBadge"
import { VoteType } from "../../../../../types/voting"

const voteTypeBadgeVariant: Record<VoteType, Badge["props"]["variant"]> = {
  [VoteType.VOTE_FOR]: "positive",
  [VoteType.VOTE_AGAINST]: "negative",
  [VoteType.ABSTAIN]: "neutral",
}

const voteTypeLabelKey: Record<VoteType, string> = {
  [VoteType.VOTE_FOR]: "Voted for",
  [VoteType.VOTE_AGAINST]: "Voted against",
  [VoteType.ABSTAIN]: "Abstained",
}

type Props = {
  proposalId: string
  metadata?: ProposalMetadata
  voteType?: VoteType
}
export const ProposalBox = ({ proposalId, metadata, voteType }: Props) => {
  const { t } = useTranslation()
  const { data: proposalState } = useProposalState(proposalId)
  const [isDesktop] = useMediaQuery(["(min-width: 500px)"])
  const title = useMemo(() => {
    if (!metadata?.title) return "Proposal title temporarily unavailable"
    if (isDesktop && metadata.title.length > 95) return metadata.title.slice(0, 95) + "..."
    if (!isDesktop && metadata.title.length > 38) return metadata.title.slice(0, 38) + "..."
    return metadata.title
  }, [metadata?.title, isDesktop])
  return (
    <LinkBox asChild>
      <Card.Root w={"full"} variant="subtle" p="3">
        <Card.Body display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
          <VStack w={"full"} alignItems={"start"} gap={2}>
            <HStack gap={2} flexWrap="wrap">
              <ProposalStatusBadge
                proposalId={proposalId}
                proposalState={proposalState}
                badgeProps={{ textStyle: "xs" }}
              />
              {voteType && (
                <Badge variant={voteTypeBadgeVariant[voteType]} rounded="full" textStyle="xs">
                  {t(voteTypeLabelKey[voteType])}
                </Badge>
              )}
            </HStack>
            <LinkOverlay asChild>
              <NextLink href={`/proposals/${proposalId}`}>
                <Text textStyle="sm" fontWeight="semibold">
                  {title}
                </Text>
              </NextLink>
            </LinkOverlay>
          </VStack>
          <Icon as={IoIosArrowForward} boxSize={{ base: 4, md: 6 }} color="icon.default" />
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
