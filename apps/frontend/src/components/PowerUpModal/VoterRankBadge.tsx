"use client"

import { Card, HStack, Icon, Skeleton, Text } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { Trophy } from "iconoir-react"
import { useTranslation } from "react-i18next"

import { useRichlistRank } from "@/api/indexer/richlist/useRichlistRank"

export const VoterRankBadge = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data, isLoading } = useRichlistRank(account?.address ?? undefined, "VOT3")

  if (!account?.address) return null
  if (!isLoading && !data) return null
  if (!isLoading && data?.balance === "0") return null

  const percent = data ? Math.round(data.topPercentage) : null

  return (
    <Skeleton loading={isLoading} borderRadius="2xl" w="full">
      <Card.Root w="full" p={3} bg="card.default" border="1px solid" borderColor="status.warning.strong" rounded="2xl">
        <HStack gap={3}>
          <Icon as={Trophy} boxSize="5" color={"status.warning.strong"} flexShrink={0} />
          <Text textStyle="sm" fontWeight="semibold" color={"status.warning.strong"}>
            {percent != null
              ? t(
                  "Great job — you’re among the top {{percent}}% of voters. Add more Voting Power to climb even higher.",
                  { percent },
                )
              : ""}
          </Text>
        </HStack>
      </Card.Root>
    </Skeleton>
  )
}
