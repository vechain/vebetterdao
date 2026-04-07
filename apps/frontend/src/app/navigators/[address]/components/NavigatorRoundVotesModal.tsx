"use client"

import { Badge, Card, Grid, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { AppImage } from "@/components/AppImage/AppImage"
import { BaseModal } from "@/components/BaseModal"

import { RoundVote } from "./NavigatorRoundVotesCard"

type Props = {
  isOpen: boolean
  onClose: () => void
  round: RoundVote | null
}

export const NavigatorRoundVotesModal = ({ isOpen, onClose, round }: Props) => {
  const { t } = useTranslation()

  const totalVotes = useMemo(() => round?.apps.reduce((sum, a) => sum + a.votes, 0) ?? 0, [round?.apps])

  if (!round) return null

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={t("Round #{{round}}", { round: round.roundId })}
      showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <HStack justify="space-between">
          <Heading size={{ base: "md", md: "lg" }} fontWeight="semibold">
            {t("Round #{{round}}", { round: round.roundId })}
          </Heading>
          <Badge variant="neutral" size="sm" rounded="sm">
            {round.apps.length} {t("apps")}
          </Badge>
        </HStack>

        <VStack gap={1.5} align="stretch">
          {round.apps.map(app => {
            const pct = totalVotes > 0 ? (app.votes / totalVotes) * 100 : 0
            return (
              <Card.Root key={app.appId} p={3} bg="card.subtle" asChild>
                <Grid gap={3} gridTemplateColumns="32px 1fr auto" alignItems="center">
                  <AppImage appId={app.appId} boxSize="8" shape="square" borderRadius="lg" />
                  <Text textStyle="sm" fontWeight="semibold" lineClamp={1}>
                    {app.appName || "-"}
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">
                    {`${pct.toFixed(1)}${t("%")}`}
                  </Text>
                </Grid>
              </Card.Root>
            )
          })}
        </VStack>
      </VStack>
    </BaseModal>
  )
}
