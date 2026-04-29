import { Badge, Button, Card, HStack, Heading, Icon, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import { ProposalBox } from "@/app/profile/components/ProfileGovernance/components/ProposalBox"
import ProposalIcon from "@/components/Icons/svg/sign.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { useUserCreatedProposal } from "@/hooks/proposals/common/useUserCreatedProposal"

import { NavigatorProposalsModal } from "./modals/NavigatorProposalsModal"

const PREVIEW_COUNT = 3

type Props = {
  address: string
}

export const NavigatorCreatedProposalsCard = ({ address }: Props) => {
  const { t } = useTranslation()
  const { data: createdProposalsRaw } = useUserCreatedProposal(address)
  const createdProposals = useMemo(
    () => createdProposalsRaw?.slice().sort((a, b) => Number(b.id) - Number(a.id)),
    [createdProposalsRaw],
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!createdProposals || createdProposals.length === 0) {
    return (
      <Card.Root variant="primary" w="full" h="full">
        <Card.Body asChild>
          <EmptyState
            title={t("Created proposals")}
            description={t("{{subject}} created proposals will appear here.", { subject: humanAddress(address, 4, 3) })}
            icon={
              <Icon boxSize={20} color="actions.secondary.text-lighter">
                <ProposalIcon color="rgba(117, 117, 117, 1)" />
              </Icon>
            }
          />
        </Card.Body>
      </Card.Root>
    )
  }

  return (
    <>
      <Card.Root w="full" variant="primary" h="full">
        <Card.Body>
          <HStack w="full" justify="space-between" align="center" mb={{ base: 2, md: 4 }}>
            <HStack gap={2} align="center">
              <Heading size="md">{t("Created proposals")}</Heading>
              <Badge variant="neutral" size="sm" rounded="sm">
                {createdProposals.length}
              </Badge>
            </HStack>
            {createdProposals.length > PREVIEW_COUNT && (
              <Button variant="ghost" size="sm" fontWeight="semibold" onClick={() => setIsModalOpen(true)}>
                {t("View all")}
                <FiArrowUpRight size={16} />
              </Button>
            )}
          </HStack>
          <VStack w="full" gap={3}>
            {createdProposals.slice(0, PREVIEW_COUNT).map(proposal => (
              <ProposalBox
                key={proposal.id}
                proposalId={proposal.id}
                metadata={{
                  title: proposal.title,
                  shortDescription: proposal.description,
                  markdownDescription: proposal.markdownDescription,
                }}
              />
            ))}
          </VStack>
        </Card.Body>
      </Card.Root>

      <NavigatorProposalsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("Created Proposals")}
        description={t("All governance proposals created by this navigator.")}
        proposals={createdProposals}
      />
    </>
  )
}
