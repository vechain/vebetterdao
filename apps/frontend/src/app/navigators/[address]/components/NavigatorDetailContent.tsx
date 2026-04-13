import { Alert, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useGetTextRecords, useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useParams, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuCompass, LuDoorOpen, LuUserCheck } from "react-icons/lu"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useNavigatorStatus } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStatus"
import { useMyDelegationInfo } from "@/api/indexer/navigators/useMyDelegationInfo"
import { useNavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
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
import { NavigatorGovernanceActivity } from "./NavigatorGovernanceActivity"
import { NavigatorHeader } from "./NavigatorHeader/NavigatorHeader"
import { NavigatorRoundHistory } from "./NavigatorRoundHistory"
import { NavigatorStatsGrid } from "./NavigatorStatsGrid"
import { NavigatorTaskList } from "./NavigatorTaskList"

const formatter = getCompactFormatter(2)

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

  const { data: nav, isLoading: navLoading } = useNavigatorByAddress(address, { waitForIndexer })
  const { data: metadata, isLoading: metadataLoading } = useNavigatorMetadata(nav?.metadataURI)
  const { data: domainData, isLoading: domainLoading } = useVechainDomain(address)
  const { data: textRecords } = useGetTextRecords(domainData?.domain)
  const { data: currentDelegation } = useGetDelegatedAmount(account?.address)
  const { data: currentNavigator } = useGetNavigator(account?.address)
  const { data: status } = useNavigatorStatus(address)
  const { data: delegationInfo } = useMyDelegationInfo(address)

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

  return (
    <VStack w="full" gap={6} align="stretch">
      <PageBreadcrumb
        items={[
          { label: t("Navigators"), href: "/navigators" },
          { label: domainData?.domain ? displayName : t("Overview"), href: `/navigators/${address}` },
        ]}
      />

      {status === "EXITING" && (
        <Alert.Root status="warning" borderRadius="xl">
          <Alert.Indicator>
            <LuDoorOpen />
          </Alert.Indicator>
          <Alert.Title textStyle="sm">
            {isOwnPage
              ? t("You have announced your exit. Continue voting during the notice period.")
              : t("This navigator is exiting. Delegations will become void after the notice period.")}
          </Alert.Title>
        </Alert.Root>
      )}

      {status === "DEACTIVATED" && (
        <Alert.Root status="error" borderRadius="xl">
          <Alert.Indicator>
            <LuDoorOpen />
          </Alert.Indicator>
          <Alert.Title textStyle="sm">
            {isOwnPage
              ? t("You have been deactivated. You can still withdraw your remaining stake.")
              : t("This navigator has been deactivated.")}
          </Alert.Title>
        </Alert.Root>
      )}

      {isDelegatedHere && (
        <Alert.Root status="info" borderRadius="xl">
          <Alert.Indicator>
            <LuUserCheck />
          </Alert.Indicator>
          <Alert.Title textStyle="sm">
            {t("You are delegating {{amount}} VOT3 to {{name}}", {
              amount: formatter.format(currentDelegatedNum),
              name: displayName,
            })}
            {delegationInfo?.delegatedAt &&
              ` ${t("since {{date}}", {
                date: new Date(delegationInfo.delegatedAt * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
              })}`}
          </Alert.Title>
        </Alert.Root>
      )}

      <NavigatorHeader
        address={address}
        displayName={displayName}
        domainLoading={domainLoading}
        bio={textRecords?.description}
        metadata={metadata}
        metadataLoading={metadataLoading}
        status={status ?? "NONE"}
        isDelegatedHere={isDelegatedHere}
        isConnected={!!account?.address}
        isOwnPage={isOwnPage}
        hasStake={Number(nav.stakeFormatted ?? 0) > 0}
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

      {isOwnPage && (status === "ACTIVE" || status === "EXITING") && (
        <NavigatorTaskList onSubmitReport={() => setIsReportOpen(true)} />
      )}

      <NavigatorGovernanceActivity address={address} />

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
      {metadata && nav.metadataURI && (
        <EditNavigatorProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          metadata={metadata}
          metadataURI={nav.metadataURI}
        />
      )}
      <NavigatorReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </VStack>
  )
}
