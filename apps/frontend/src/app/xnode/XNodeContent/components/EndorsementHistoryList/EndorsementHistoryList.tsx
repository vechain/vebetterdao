import { useXNode } from "@/api"
import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { Card, CardBody, Heading, VStack, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { EndorsementHistoryItem } from "./EndorsementHistoryItem"
import { useCallback, useState } from "react"

export const EndorsementHistoryList = () => {
  const { t } = useTranslation()
  const { xNodeId } = useXNode()
  const { data: appEndorsedEvents } = useAppEndorsedEvents({ nodeId: xNodeId ?? undefined })
  const [displayCount, setDisplayCount] = useState(5)

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prevCount => Math.min(prevCount + 5, appEndorsedEvents?.length || 0))
  }, [appEndorsedEvents])

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <Heading fontSize="xl" fontWeight="700">
            {t("Endorsement history")}
          </Heading>
          {appEndorsedEvents
            ?.slice(0, displayCount)
            .map((event, index) => <EndorsementHistoryItem key={index} event={event} />)}
          {appEndorsedEvents && displayCount < appEndorsedEvents.length && (
            <Button onClick={handleLoadMore} variant="primaryLink">
              {t("Load more")}
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
