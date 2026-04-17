import { HStack, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ChallengeView } from "@/api/challenges/types"
import { useChallengeSelectedApps } from "@/api/challenges/useChallengeSelectedApps"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useMostVotedAppsInRound } from "@/api/contracts/xApps/hooks/useMostVotedAppsInRound"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { AppImage } from "@/components/AppImage/AppImage"

const MAX_VISIBLE = 10

interface Props {
  challenge: ChallengeView
}

export const ChallengeEligibleAppsRow = ({ challenge }: Props) => {
  const { t } = useTranslation()
  const { data: appsData } = useXApps()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: mostVoted } = useMostVotedAppsInRound(challenge.allApps ? currentRoundId : undefined)

  const { data: selectedApps } = useChallengeSelectedApps(
    challenge.challengeId,
    !challenge.allApps && challenge.selectedAppsCount > 0,
  )

  const appNames = useMemo(
    () => new Map((appsData?.allApps ?? []).map(app => [app.id.toLowerCase(), app.name])),
    [appsData?.allApps],
  )

  const allAppsIds = useMemo(
    () => (challenge.allApps ? mostVoted.slice(0, MAX_VISIBLE).map(a => a.id) : []),
    [challenge.allApps, mostVoted],
  )

  const appIds = challenge.allApps ? allAppsIds : (selectedApps ?? [])
  const isSingleApp = !challenge.allApps && appIds.length === 1
  const singleAppName = isSingleApp ? appNames.get(appIds[0]?.toLowerCase() ?? "") : null
  const visibleIds = appIds.slice(0, MAX_VISIBLE)
  const overflowCount = Math.max(appIds.length - MAX_VISIBLE, 0)
  const totalAppsCount = challenge.allApps ? (appsData?.allApps?.length ?? 0) : appIds.length

  if (!challenge.allApps && appIds.length === 0) return null

  return (
    <VStack gap="1" py="2" px="3" align="start" w="full">
      <Text textStyle="xs" pb={2} color="text.subtle" fontWeight="semibold">
        {t("Eligible Apps")}
      </Text>
      {isSingleApp ? (
        <HStack gap="2" minW="0">
          <AppImage appId={appIds[0] ?? ""} boxSize="7" borderRadius="full" flexShrink={0} />
          <Text textStyle="md" fontWeight="bold" truncate>
            {singleAppName ?? appIds[0]}
          </Text>
        </HStack>
      ) : (
        <HStack gap="0" align="center" minW="0">
          {visibleIds.map((appId, i) => (
            <AppImage
              key={appId}
              appId={appId}
              boxSize="7"
              borderRadius="full"
              border="2px solid"
              borderColor="bg.default"
              ml={i > 0 ? "-2" : "0"}
              flexShrink={0}
            />
          ))}
          {(overflowCount > 0 || challenge.allApps) && (
            <Text textStyle="xs" color="text.subtle" fontWeight="semibold" ml="2">
              {challenge.allApps
                ? t("+ {{count}} more", { count: totalAppsCount - visibleIds.length })
                : t("+ {{count}} more", { count: overflowCount })}
            </Text>
          )}
        </HStack>
      )}
    </VStack>
  )
}
