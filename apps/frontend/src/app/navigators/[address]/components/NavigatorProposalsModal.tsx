"use client"

import { Badge, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ProposalBox } from "@/app/profile/components/ProfileGovernance/components/ProposalBox"
import { BaseModal } from "@/components/BaseModal"
import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { VoteType } from "@/types/voting"

const PAGE_SIZE = 10

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  proposals: (ProposalEnriched | GrantProposalEnriched)[]
  voteTypes?: Record<string, VoteType>
}

export const NavigatorProposalsModal = ({ isOpen, onClose, title, description, proposals, voteTypes }: Props) => {
  const { t } = useTranslation()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const visible = proposals.slice(0, visibleCount)
  const hasMore = visibleCount < proposals.length

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={title} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <VStack gap={1} align="start">
          <HStack justify="space-between" w="full">
            <Heading size={{ base: "md", md: "lg" }} fontWeight="semibold">
              {title}
            </Heading>
            <Badge variant="neutral" size="sm" rounded="sm">
              {proposals.length}
            </Badge>
          </HStack>
          <Text textStyle="sm" color="text.subtle">
            {description}
          </Text>
        </VStack>

        <VStack gap={3} align="stretch">
          {visible.map(proposal => (
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

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              fontWeight="semibold"
              onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}>
              {t("View more")}
            </Button>
          )}
        </VStack>
      </VStack>
    </BaseModal>
  )
}
