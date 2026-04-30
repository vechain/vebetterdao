import { Heading, Stack, Text, VStack } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useParams, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuCompass } from "react-icons/lu"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useGetMetadataURI } from "@/api/contracts/navigatorRegistry/hooks/useGetMetadataURI"
import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useNavigatorReportEvents } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorReportEvents"
import { useNavigatorStatus } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStatus"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useMyDelegationInfo } from "@/api/indexer/navigators/useMyDelegationInfo"
import { useNavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { useIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"
import { DelegationModal } from "@/app/navigators/shared/DelegationModal"

import { AnnounceExitModal } from "./modals/AnnounceExitModal"
import { EditNavigatorProfileModal } from "./modals/EditNavigatorProfileModal"
import { ManageStakeModal } from "./modals/ManageStakeModal"
import { NavigatorCitizensModal } from "./modals/NavigatorCitizensModal"
import { NavigatorDelegationsModal } from "./modals/NavigatorDelegationsModal"
import { NavigatorReportModal } from "./modals/NavigatorReportModal"
import { NavigatorStakeHistoryModal } from "./modals/NavigatorStakeHistoryModal"
import { WithdrawStakeModal } from "./modals/WithdrawStakeModal"
import { NavigatorDetailSkeleton } from "./NavigatorDetailSkeleton"
import { NavigatorHeader } from "./NavigatorHeader/NavigatorHeader"
import { NavigatorRewardsCard } from "./NavigatorRewardsCard"
import { NavigatorRoundHistory } from "./NavigatorRoundHistory/NavigatorRoundHistory"
import { NavigatorStatsGrid } from "./NavigatorStatsGrid"
import { NavigatorStatusAlerts } from "./NavigatorStatusAlerts"
import { NavigatorTaskList } from "./NavigatorTaskList"

export const NavigatorDetailContent = () => {
  const { t } = useTranslation()
  const params = useParams<{ address: string }>()
  const searchParams = useSearchParams()
  const { account } = useWallet()
  const address = params?.address ?? ""
  const waitForIndexer = searchParams?.get("registered") === "true"
  const [isDelegationOpen, setIsDelegationOpen] = useState(false)
  const [isExitMode, setIsExitMode] = useState(false)
  const [isCitizensOpen, setIsCitizensOpen] = useState(false)
  const [isStakeHistoryOpen, setIsStakeHistoryOpen] = useState(false)
  const [isDelegationsOpen, setIsDelegationsOpen] = useState(false)
  const [isManageStakeOpen, setIsManageStakeOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isAnnounceExitOpen, setIsAnnounceExitOpen] = useState(false)
  const [isWithdrawStakeOpen, setIsWithdrawStakeOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)

  const { data: reportEventsForEdit } = useNavigatorReportEvents(address)

  const { data: nav, isLoading: navLoading } = useNavigatorByAddress(address, { waitForIndexer })
  // Read metadataURI directly from the contract so edits reflect immediately on refresh
  // without waiting for the indexer to pick up MetadataURIUpdated events.
  const { data: metadataURI } = useGetMetadataURI(address)
  const { data: metadata, isLoading: metadataLoading } = useNavigatorMetadata(metadataURI)
  const { data: domainData, isLoading: domainLoading } = useVechainDomain(address)
  const { data: currentDelegation } = useGetDelegatedAmount(account?.address)
  const { data: currentNavigator } = useGetNavigator(account?.address)
  const { data: status } = useNavigatorStatus(address)
  const { data: delegationInfo } = useMyDelegationInfo(address)

  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const currentRoundReportURI = useMemo(() => {
    if (!reportEventsForEdit || !currentRoundId) return undefined
    // Events are ascending; pick the latest matching one so re-submissions overwrite older entries.
    return reportEventsForEdit.findLast(e => e.roundId === currentRoundId)?.reportURI
  }, [reportEventsForEdit, currentRoundId])
  const { data: currentReportData } = useIpfsMetadata<{ link?: string; text?: string }>(currentRoundReportURI)

  const displayName = domainData?.domain ? humanDomain(domainData.domain, 20, 10) : humanAddress(address, 10, 8)

  if (navLoading || (waitForIndexer && !nav)) {
    return <NavigatorDetailSkeleton />
  }

  if (!nav) {
    return (
      <VStack w="full" gap={4} align="stretch" px={{ base: 4, md: 0 }}>
        <PageBreadcrumb items={[{ label: t("Navigators"), href: "/navigators" }]} />
        <VStack w="full" py={20} gap={4}>
          <LuCompass size={48} />
          <Text textStyle="md" color="fg.muted">
            {t("Navigator not found")}
          </Text>
        </VStack>
      </VStack>
    )
  }

  const isOwnPage = !!account?.address && account.address.toLowerCase() === address.toLowerCase()
  const currentDelegatedNum = currentDelegation ? Number(currentDelegation.scaled) : 0
  const isDelegatedHere = currentNavigator?.toLowerCase() === address.toLowerCase() && currentDelegatedNum > 0
  const isAtCapacity = Number(nav.stakeFormatted ?? 0) * 10 <= Number(nav.totalDelegatedFormatted ?? 0)

  return (
    <VStack w="full" gap={6} align="stretch">
      <PageBreadcrumb
        items={[
          { label: t("Navigators"), href: "/navigators" },
          { label: t("Overview"), href: `/navigators/${address}` },
        ]}
      />

      <NavigatorStatusAlerts
        status={status ?? "NONE"}
        isOwnPage={isOwnPage}
        isDelegatedHere={isDelegatedHere}
        isAtCapacity={isAtCapacity}
        currentDelegatedNum={currentDelegatedNum}
        displayName={displayName}
        delegationInfo={delegationInfo}
      />

      <NavigatorHeader
        address={address}
        displayName={displayName}
        domainLoading={domainLoading}
        metadata={metadata}
        metadataLoading={metadataLoading}
        status={status ?? "NONE"}
        isDelegatedHere={isDelegatedHere}
        isConnected={!!account?.address}
        isOwnPage={isOwnPage}
        hasStake={Number(nav.stakeFormatted ?? 0) > 0}
        isAtCapacity={isAtCapacity}
        onDelegationClick={() => {
          setIsExitMode(false)
          setIsDelegationOpen(true)
        }}
        registeredAt={nav.registeredAt}
        onManageStakeClick={() => setIsManageStakeOpen(true)}
        onWithdrawStakeClick={() => setIsWithdrawStakeOpen(true)}
        onExitDelegation={() => {
          setIsExitMode(true)
          setIsDelegationOpen(true)
        }}
        onEditProfile={() => setIsEditProfileOpen(true)}
        onAnnounceExit={() => setIsAnnounceExitOpen(true)}
      />

      <NavigatorStatsGrid
        navigator={nav}
        onCitizensClick={() => setIsCitizensOpen(true)}
        onStakedClick={() => setIsStakeHistoryOpen(true)}
        onDelegatedClick={() => setIsDelegationsOpen(true)}
      />

      {isOwnPage && (
        <>
          <Heading size="lg">{t("Tasks & Rewards")}</Heading>
          <Stack direction={{ base: "column", md: "row" }} gap={4} align="stretch" w="full">
            {(status === "ACTIVE" || status === "EXITING") && (
              <NavigatorTaskList address={address} onSubmitReport={() => setIsReportOpen(true)} />
            )}
            <NavigatorRewardsCard address={address} />
          </Stack>
        </>
      )}

      <NavigatorRoundHistory address={address} isOwnPage={isOwnPage} />

      <DelegationModal
        isOpen={isDelegationOpen}
        onClose={() => setIsDelegationOpen(false)}
        navigator={nav}
        exitMode={isExitMode}
      />
      <NavigatorCitizensModal isOpen={isCitizensOpen} onClose={() => setIsCitizensOpen(false)} address={address} />
      <NavigatorStakeHistoryModal
        isOpen={isStakeHistoryOpen}
        onClose={() => setIsStakeHistoryOpen(false)}
        address={address}
      />
      <NavigatorDelegationsModal
        isOpen={isDelegationsOpen}
        onClose={() => setIsDelegationsOpen(false)}
        address={address}
      />
      <ManageStakeModal isOpen={isManageStakeOpen} onClose={() => setIsManageStakeOpen(false)} navigator={nav} />
      <WithdrawStakeModal isOpen={isWithdrawStakeOpen} onClose={() => setIsWithdrawStakeOpen(false)} navigator={nav} />
      <AnnounceExitModal isOpen={isAnnounceExitOpen} onClose={() => setIsAnnounceExitOpen(false)} />
      {metadata && metadataURI && (
        <EditNavigatorProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          address={address}
          metadata={metadata}
        />
      )}
      <NavigatorReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        initialLink={currentReportData?.link}
        initialText={currentReportData?.text}
      />
    </VStack>
  )
}
