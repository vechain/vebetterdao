import { Badge, Button, Card, Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import {
  mapSupportToVoteType,
  useUserProposalsVoteEvents,
} from "@/api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { useUserVotedProposals } from "@/api/contracts/governance/hooks/useUserVotedProposals"
import { useUserTopVotedApps } from "@/api/contracts/xApps/hooks/useUserTopVotedApps"
import { AppVotedBox } from "@/app/profile/components/ProfileGovernance/components/AppVotedBox"
import { ProposalBox } from "@/app/profile/components/ProfileGovernance/components/ProposalBox"
import HandPlantIcon from "@/components/Icons/svg/hand-plant.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { useUserCreatedProposal } from "@/hooks/proposals/common/useUserCreatedProposal"
import { VoteType } from "@/types/voting"

import { NavigatorProposalsModal } from "./NavigatorProposalsModal"
import { NavigatorRoundVotesCard } from "./NavigatorRoundVotesCard"
import { NavigatorTopAppsModal } from "./NavigatorTopAppsModal"

const PREVIEW_COUNT = 3

type ModalState = "created" | "voted" | "apps" | null

type Props = {
  address: string
}

export const NavigatorGovernanceActivity = ({ address }: Props) => {
  const { t } = useTranslation()
  const { data: createdProposalsRaw } = useUserCreatedProposal(address)
  const createdProposals = useMemo(
    () => createdProposalsRaw?.slice().sort((a, b) => Number(b.id) - Number(a.id)),
    [createdProposalsRaw],
  )
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

  const topVotedApps = useUserTopVotedApps(address)
  const [openModal, setOpenModal] = useState<ModalState>(null)

  return (
    <>
      <VStack gap={6} w="full">
        {/* Created Proposals */}
        {createdProposals && createdProposals.length > 0 && (
          <Card.Root w="full" variant="primary">
            <Card.Body>
              <HStack w="full" justify="space-between" align="center" mb={{ base: 2, md: 4 }}>
                <HStack gap={2} align="center">
                  <Heading size={{ base: "lg", md: "xl" }} fontWeight="bold">
                    {t("Created Proposals")}
                  </Heading>
                  <Badge variant="neutral" size="sm" rounded="sm">
                    {createdProposals.length}
                  </Badge>
                </HStack>
                {createdProposals.length > PREVIEW_COUNT && (
                  <Button variant="ghost" size="sm" fontWeight="semibold" onClick={() => setOpenModal("created")}>
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
        )}

        {/* Voted Proposals */}
        {votedProposalsWithDescription && votedProposalsWithDescription.length > 0 ? (
          <Card.Root w="full" variant="primary">
            <Card.Body>
              <HStack w="full" justify="space-between" align="center" mb={{ base: 2, md: 4 }}>
                <HStack gap={2} align="center">
                  <Heading size={{ base: "lg", md: "xl" }} fontWeight="bold">
                    {t("Voted Proposals")}
                  </Heading>
                  <Badge variant="neutral" size="sm" rounded="sm">
                    {votedProposalsWithDescription.length}
                  </Badge>
                </HStack>
                {votedProposalsWithDescription.length > PREVIEW_COUNT && (
                  <Button variant="ghost" size="sm" fontWeight="semibold" onClick={() => setOpenModal("voted")}>
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
        ) : (
          <Card.Root variant="primary" w="full">
            <Heading size={{ base: "lg", md: "xl" }} fontWeight="bold">
              {t("Voted Proposals")}
            </Heading>
            <Card.Body asChild>
              <EmptyState
                title={t("Voted Proposals")}
                description={t("{{subject}} voted proposals will appear here.", {
                  subject: `${humanAddress(address, 4, 3)}`,
                })}
                icon={
                  <Icon boxSize={20} color="actions.secondary.text-lighter">
                    <HandPlantIcon color="rgba(117, 117, 117, 1)" />
                  </Icon>
                }
              />
            </Card.Body>
          </Card.Root>
        )}

        <NavigatorRoundVotesCard address={address} />

        {/* Most Voted Apps */}
        {topVotedApps && topVotedApps.length > 0 ? (
          <Card.Root w="full" variant="primary">
            <Card.Body>
              <HStack w="full" justify="space-between" align="center" mb={{ base: 2, md: 4 }}>
                <HStack gap={2} align="center">
                  <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold">
                    {t("Most voted apps")}
                  </Text>
                  <Badge variant="neutral" size="sm" rounded="sm">
                    {topVotedApps.length}
                  </Badge>
                </HStack>
                {topVotedApps.length > PREVIEW_COUNT && (
                  <Button variant="ghost" size="sm" fontWeight="semibold" onClick={() => setOpenModal("apps")}>
                    {t("View all")}
                    <FiArrowUpRight size={16} />
                  </Button>
                )}
              </HStack>
              <VStack w="full" gap={3}>
                {topVotedApps.slice(0, PREVIEW_COUNT).map(app => (
                  <AppVotedBox key={app.appId} appVoted={app} />
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>
        ) : (
          <Card.Root variant="primary" w="full">
            <Card.Title textStyle="xl">{t("Most voted apps")}</Card.Title>
            <Card.Body asChild>
              <EmptyState
                title={t("Most voted apps")}
                description={t("{{subject}} top voted apps will appear here.", {
                  subject: `${humanAddress(address, 4, 3)}`,
                })}
                icon={
                  <Icon boxSize={20} color="actions.secondary.text-lighter">
                    <HandPlantIcon color="rgba(117, 117, 117, 1)" />
                  </Icon>
                }
              />
            </Card.Body>
          </Card.Root>
        )}
      </VStack>

      {/* Modals */}
      <NavigatorProposalsModal
        isOpen={openModal === "created"}
        onClose={() => setOpenModal(null)}
        title={t("Created Proposals")}
        description={t("All governance proposals created by this navigator.")}
        proposals={createdProposals ?? []}
      />

      <NavigatorProposalsModal
        isOpen={openModal === "voted"}
        onClose={() => setOpenModal(null)}
        title={t("Voted Proposals")}
        description={t("All governance proposals this navigator has voted on.")}
        proposals={votedProposalsWithDescription ?? []}
        voteTypes={voteTypes}
      />

      <NavigatorTopAppsModal
        isOpen={openModal === "apps"}
        onClose={() => setOpenModal(null)}
        apps={topVotedApps ?? []}
        description={t("Apps ranked by total votes received from this navigator.")}
      />
    </>
  )
}
