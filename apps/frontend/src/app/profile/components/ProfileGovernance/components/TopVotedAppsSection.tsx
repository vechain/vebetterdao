import { HStack, VStack, Text, Card, Button } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaChartPie } from "react-icons/fa6"
import { FiArrowUpRight } from "react-icons/fi"

import { useUserTopVotedApps } from "../../../../../api/contracts/xApps/hooks/useUserTopVotedApps"
import { VoteBoxIcon } from "../../../../../components/VoteBoxIcon"

import { AppVotedBox } from "./AppVotedBox"
import { EmptyStateGovernance } from "./EmptyStateGovernance"

type Props = {
  address: string
  onSeeAll: () => void
  onExploreGovernance: () => void
  previewSize?: number
}

export const TopVotedAppsSection = ({ address, onSeeAll, onExploreGovernance, previewSize = 3 }: Props) => {
  const { account } = useWallet()
  const isConnectedUser = compareAddresses(address, account?.address ?? "")

  const { t } = useTranslation()
  const topVotedApps = useUserTopVotedApps(address)

  const firstTopVotedApps = useMemo(() => topVotedApps?.slice(0, previewSize), [topVotedApps, previewSize])

  const isMoreTopVotedApps = useMemo(() => {
    if (!topVotedApps) return false
    return topVotedApps.length > previewSize
  }, [topVotedApps, previewSize])

  const hasApps = firstTopVotedApps && firstTopVotedApps.length > 0

  // if user is not connected, don't show the top voted apps
  if (!address) return null

  if (!hasApps) {
    return (
      <EmptyStateGovernance
        title={t("Most voted apps")}
        description={t("{{subject}} top voted apps will appear here.", {
          subject: isConnectedUser ? "Your" : `${humanAddress(address ?? "", 4, 3)}`,
        })}
        buttonText={t("Explore allocations")}
        illustration={<VoteBoxIcon color="rgba(117, 117, 117, 1)" />}
        buttonIcon={FaChartPie}
        onClick={onExploreGovernance}
      />
    )
  }

  return (
    <Card.Root w={"full"} variant="primary">
      <Card.Body>
        <HStack w={"full"} alignItems="center" justifyContent={"space-between"} mb={{ base: 2, md: 4 }}>
          <Text textStyle={{ base: "lg", md: "xl" }} fontWeight={"bold"}>
            {t("Most Voted Apps")}
          </Text>
          {isMoreTopVotedApps && (
            <Button variant="link" size="sm" onClick={onSeeAll} fontWeight="semibold">
              {t("See All")}
              <FiArrowUpRight size={16} />
            </Button>
          )}
        </HStack>
        <VStack w={"full"} gap={4}>
          {firstTopVotedApps.map(app => (
            <AppVotedBox key={app.appId} appVoted={app} />
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
