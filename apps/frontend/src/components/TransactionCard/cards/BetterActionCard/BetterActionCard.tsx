import { Button, Circle, Icon, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UserB3trActions, useXApps } from "@/api"
import dayjs from "dayjs"
import { TbLeaf } from "react-icons/tb"
import { useTranslation } from "react-i18next"
import { ActionModal } from "./components/ActionModal"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

const compactFormatter = getCompactFormatter(2)

type Props = {
  appId?: string
  blockNumber?: number
  blockTimestamp?: number
  amountB3tr?: number
  proof?: UserB3trActions[number]["proof"]
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
        variant="subtle"
        onClick={actionModal.onOpen}
        h="auto"
        rounded="xl"
        display="flex"
        px={3}
        py={2}
        justifyContent="flex-start"
        alignItems="center">
        <Circle size={10} bg="brand.secondary-strong">
          <Icon as={TbLeaf} color="brand.secondary" boxSize={4} />
        </Circle>

        <VStack gap={0} alignItems="flex-start" flex={1}>
          <HStack gap={1} flexWrap={"wrap"}>
            <Text textStyle={"sm"}>{t("Better action on")}</Text>
            <Text textStyle={"sm"} fontWeight="semibold">
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
