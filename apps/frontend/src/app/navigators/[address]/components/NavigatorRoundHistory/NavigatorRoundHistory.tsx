"use client"

import { Box, Button, Heading, HStack, IconButton, VStack } from "@chakra-ui/react"
import { Activity } from "iconoir-react"
import { useRouter } from "next/navigation"
import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"
import { A11y, Navigation } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/navigation"

import { EmptyState } from "@/components/ui/empty-state"

import { NavigatorProposalVoteModal } from "../modals/NavigatorProposalVoteModal"
import { NavigatorRoundVotesModal } from "../modals/NavigatorRoundVotesModal"
import { ReportNavigatorModal } from "../modals/ReportNavigatorModal"
import { ViewReportModal } from "../modals/ViewReportModal"

import { RoundCard } from "./RoundCard"
import { type RoundVote } from "./types"
import { useRoundsCompliance } from "./useRoundsCompliance"
import { SWIPER_BREAKPOINTS } from "./utils"

type Props = {
  address: string
  isOwnPage: boolean
}

export const NavigatorRoundHistory = ({ address, isOwnPage }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [viewReportURI, setViewReportURI] = useState<string | null>(null)
  const [selectedRoundVote, setSelectedRoundVote] = useState<RoundVote | null>(null)
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [reportRoundId, setReportRoundId] = useState<string | null>(null)

  const {
    rounds,
    roundVotesMap,
    infractionsByRound,
    slashedByRound,
    slashEventsByRound,
    estimatedPenaltyAmount,
    isLoading,
  } = useRoundsCompliance(address)

  const reportInfractions = reportRoundId ? (infractionsByRound.get(reportRoundId) ?? []) : []

  const uid = useId().replace(/:/g, "")
  const prevClass = `swiper-nav-prev-${uid}`
  const nextClass = `swiper-nav-next-${uid}`

  // Stay silent while the underlying queries resolve so freshly registered
  // navigators don't see the empty state flash before the first round loads.
  if (isLoading) return null

  if (rounds.length === 0) {
    if (isOwnPage) return null
    return (
      <>
        <Heading size="lg">{t("Activity")}</Heading>
        <EmptyState
          py="16"
          icon={<Activity />}
          title={t("No round activity yet")}
          description={t(
            "This navigator hasn't participated in an allocation round yet. View their profile to see apps and proposals they've voted on, and proposals they've created.",
          )}>
          <Button variant="outline" size="sm" mt={4} onClick={() => router.push(`/profile/${address}?tab=governance`)}>
            {t("View Profile")}
          </Button>
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <Heading size="lg">{t("Activity")}</Heading>
      <VStack gap={3} align="stretch">
        <HStack hideBelow="md" justify="flex-end" gap={1}>
          <IconButton
            className={prevClass}
            variant="ghost"
            size="xs"
            rounded="full"
            aria-label={t("Previous")}
            _disabled={{ opacity: 0.3, cursor: "not-allowed" }}>
            <LuChevronLeft />
          </IconButton>
          <IconButton
            className={nextClass}
            variant="ghost"
            size="xs"
            rounded="full"
            aria-label={t("Next")}
            _disabled={{ opacity: 0.3, cursor: "not-allowed" }}>
            <LuChevronRight />
          </IconButton>
        </HStack>

        <Box position="relative" w="full">
          <Swiper
            modules={[A11y, Navigation]}
            breakpoints={SWIPER_BREAKPOINTS}
            navigation={{ prevEl: `.${prevClass}`, nextEl: `.${nextClass}` }}
            style={{ width: "100%" }}>
            {rounds.map(round => (
              <SwiperSlide key={round.roundId} style={{ height: "auto" }}>
                <Box h="full">
                  <RoundCard
                    round={round}
                    roundVote={roundVotesMap.get(round.roundId) ?? null}
                    onViewReport={setViewReportURI}
                    onSelectAllocationVote={setSelectedRoundVote}
                    onSelectProposal={setSelectedProposalId}
                    showReportBtn={!isOwnPage && infractionsByRound.has(round.roundId)}
                    slashed={slashedByRound?.get(round.roundId)?.slashed ?? false}
                    penaltyAmount={
                      Number(slashEventsByRound?.get(round.roundId)?.amount ?? 0) || estimatedPenaltyAmount
                    }
                    onOpenReport={() => setReportRoundId(round.roundId)}
                  />
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      </VStack>

      <ViewReportModal isOpen={!!viewReportURI} onClose={() => setViewReportURI(null)} reportURI={viewReportURI} />
      <NavigatorRoundVotesModal
        isOpen={!!selectedRoundVote}
        onClose={() => setSelectedRoundVote(null)}
        round={selectedRoundVote}
      />
      <NavigatorProposalVoteModal
        isOpen={!!selectedProposalId}
        onClose={() => setSelectedProposalId(null)}
        proposalId={selectedProposalId ?? ""}
        navigatorAddress={address}
      />
      <ReportNavigatorModal
        isOpen={!!reportRoundId}
        onClose={() => setReportRoundId(null)}
        navigatorAddress={address}
        infractions={reportInfractions}
      />
    </>
  )
}
