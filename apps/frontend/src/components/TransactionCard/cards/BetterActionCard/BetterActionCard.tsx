import { Button, Circle, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { SustainabilityActionsResponse, useXApps } from "@/api"
import dayjs from "dayjs"
import { LeafIcon } from "../../../Icons/LeafIcon"
import { useTranslation } from "react-i18next"
import { ActionModal } from "./components/ActionModal"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

const compactFormatter = getCompactFormatter(2)

type Props = {
  appId?: string
  blockNumber?: number
  blockTimestamp?: number
  amountB3tr?: number
  proof?: SustainabilityActionsResponse["data"][number]["proof"]
}
export const BetterActionCard = ({ appId, blockNumber, blockTimestamp, amountB3tr, proof }: Props) => {
  const { data: apps } = useXApps()
  const { t } = useTranslation()

  const getAppName = (appId: string) => {
    return apps?.allApps.find(app => app.id === appId)?.name ?? ""
  }

  const actionModal = useDisclosure()

  return (
    <>
      <Button
        onClick={actionModal.onOpen}
        h="auto"
        rounded={8}
        display="flex"
        px={3}
        py={2}
        variant="subtle"
        color="gray"
        bg={{ base: "bg.tertiary", _hover: "bg.muted" }}
        justifyContent="flex-start"
        alignItems="center">
        <Circle size="2.5rem" bg="brand.secondary-strong">
          <LeafIcon color="brand.secondary" />
        </Circle>

        <VStack gap={0} alignItems="flex-start" flex={1}>
          <HStack gap={0} flexWrap={"wrap"}>
            <Text textStyle={"sm"} mr="1">
              {t("Better action on")}
            </Text>
            <Text textStyle={"sm"} fontWeight={600}>
              {getAppName(appId ?? "")}
            </Text>
          </HStack>
          <Text textStyle={"xs"} color="text.subtle">
            {dayjs.unix(blockTimestamp ?? 0).fromNow()}
          </Text>
        </VStack>

        <HStack gap={0.5} alignItems="center">
          <Text textStyle="md" fontWeight="semibold">
            {"+"}
            {compactFormatter.format(Number(amountB3tr))}
          </Text>
          <Text textStyle="sm">{"B3TR"}</Text>
        </HStack>
      </Button>
      <ActionModal
        actionModal={actionModal}
        proof={proof}
        appId={appId}
        blockNumber={blockNumber}
        blockTimestamp={blockTimestamp}
        b3trAmount={amountB3tr}
      />
    </>
  )
}
