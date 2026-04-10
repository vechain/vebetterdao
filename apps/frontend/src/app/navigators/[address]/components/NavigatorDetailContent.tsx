import { Alert, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useGetTextRecords, useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useParams, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuShield, LuUserCheck } from "react-icons/lu"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { useMyDelegationInfo } from "@/api/indexer/navigators/useMyDelegationInfo"
import { useNavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"
import { DelegateModal } from "@/app/navigators/shared/DelegateModal"
import { ManageDelegationModal } from "@/app/navigators/shared/ManageDelegationModal"

import { NavigatorCitizensModal } from "./modals/NavigatorCitizensModal"
import { NavigatorDelegationsModal } from "./modals/NavigatorDelegationsModal"
import { NavigatorStakeHistoryModal } from "./modals/NavigatorStakeHistoryModal"
import { NavigatorDetailSkeleton } from "./NavigatorDetailSkeleton"
import { NavigatorGovernanceActivity } from "./NavigatorGovernanceActivity"
import { NavigatorHeader } from "./NavigatorHeader/NavigatorHeader"
import { NavigatorStatsGrid } from "./NavigatorStatsGrid"

const formatter = getCompactFormatter(2)

export const NavigatorDetailContent = () => {
  const { t } = useTranslation()
  const params = useParams<{ address: string }>()
  const searchParams = useSearchParams()
  const { account } = useWallet()
  const address = params?.address ?? ""
  const waitForIndexer = searchParams?.get("registered") === "true"
  const [isDelegateOpen, setIsDelegateOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isExitMode, setIsExitMode] = useState(false)
  const [isCitizensOpen, setIsCitizensOpen] = useState(false)
  const [isStakeHistoryOpen, setIsStakeHistoryOpen] = useState(false)
  const [isDelegationsOpen, setIsDelegationsOpen] = useState(false)

  const { data: nav, isLoading: navLoading } = useNavigatorByAddress(address, { waitForIndexer })
  const { data: metadata, isLoading: metadataLoading } = useNavigatorMetadata(nav?.metadataURI)
  const { data: domainData, isLoading: domainLoading } = useVechainDomain(address)
  const { data: textRecords } = useGetTextRecords(domainData?.domain)
  const { data: currentDelegation } = useGetDelegatedAmount(account?.address)
  const { data: currentNavigator } = useGetNavigator(account?.address)
  const { data: isNavigator } = useIsNavigator()
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
          <LuShield size={48} />
          <Text textStyle="md" color="fg.muted">
            {t("Navigator not found")}
          </Text>
        </VStack>
      </VStack>
    )
  }

  const isActive = nav.status === "ACTIVE"
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

      {isDelegatedHere && (
        <Alert.Root status="info" borderRadius="xl">
          <Alert.Indicator>
            <LuUserCheck />
          </Alert.Indicator>
          <Alert.Title textStyle="sm">
            {t("You are delegating {{amount}} VOT3 to this Navigator", {
              amount: formatter.format(currentDelegatedNum),
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
        isActive={isActive}
        isDelegatedHere={isDelegatedHere}
        isConnected={!!account?.address}
        isNavigator={!!isNavigator}
        isOwnPage={!!isNavigator && !!account?.address && account.address.toLowerCase() === address.toLowerCase()}
        onDelegateClick={() => setIsDelegateOpen(true)}
        onManageClick={() => {
          setIsExitMode(false)
          setIsManageOpen(true)
        }}
        onManageStakeClick={() => {}}
        onExitDelegation={() => {
          setIsExitMode(true)
          setIsManageOpen(true)
        }}
      />

      <NavigatorStatsGrid
        navigator={nav}
        onCitizensClick={() => setIsCitizensOpen(true)}
        onStakedClick={() => setIsStakeHistoryOpen(true)}
        onDelegatedClick={() => setIsDelegationsOpen(true)}
      />

      <NavigatorGovernanceActivity address={address} />

      <DelegateModal isOpen={isDelegateOpen} onClose={() => setIsDelegateOpen(false)} navigator={nav} />
      <ManageDelegationModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
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
    </VStack>
  )
}
