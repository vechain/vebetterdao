import { Text, Card, Heading, VStack, Button } from "@chakra-ui/react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"

import { UserNode } from "../../../../../api/contracts/xNodes/useGetUserNodes"

import { EndorsementHistoryItem } from "./EndorsementHistoryItem"

export const EndorsementHistoryList = ({ node }: { node: UserNode }) => {
  const { t } = useTranslation()
  const { data: appEndorsedEvents } = useAppEndorsedEvents({ nodeId: node.id.toString() })
  const [displayCount, setDisplayCount] = useState(5)
  const handleLoadMore = useCallback(() => {
    setDisplayCount(prevCount => Math.min(prevCount + 5, appEndorsedEvents?.length || 0))
  }, [appEndorsedEvents])
  const events = appEndorsedEvents?.slice(0, displayCount)
  return (
    <Card.Root variant="primary">
      <Card.Body>
        <VStack align="stretch" gap="6">
          <Heading textStyle="xl">{t("Endorsement history")}</Heading>
          {events?.length ? (
            events.map(event => (
              <EndorsementHistoryItem
                key={`endorsement-history-${event.appId}-${event.nodeId}-${event.blockNumber}`}
                event={event}
              />
            ))
          ) : (
            <Text>{t("No endorsement events")}</Text>
          )}
          {appEndorsedEvents && displayCount < appEndorsedEvents.length && (
            <Button onClick={handleLoadMore} variant="link">
              {t("Load more")}
            </Button>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
