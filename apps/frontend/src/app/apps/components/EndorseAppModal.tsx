import { VStack, Heading, Box, Text, Button, Skeleton, Card, Image, RadioGroup } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { t } from "i18next"
import { useCallback, useMemo, useState } from "react"

import { BaseModal } from "@/components/BaseModal"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { useAllocationsRound } from "../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { UnendorsedApp, XApp } from "../../../api/contracts/xApps/getXApps"
import { useAppEndorsementScore } from "../../../api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { useGetUserNodes } from "../../../api/contracts/xNodes/useGetUserNodes"
import { useEndorseApp } from "../../../hooks/xApp/useEndorseApp"
import { GenericAlert } from "../../components/Alert/GenericAlert"

type Props = {
  isOpen: boolean
  onClose: () => void
  xApp: XApp | UnendorsedApp | undefined
}
export const EndorseAppModal = ({ xApp, isOpen, onClose }: Props) => {
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: endorsementScore } = useAppEndorsementScore(xApp?.id ?? "")
  const { data: nodes, isLoading: isUserNodesLoading } = useGetUserNodes()
  const nodesNotEndorsingApp = useMemo(() => {
    // TODO: Filter by endorsedAppId from nodeToEndorsedApp contract call
    return nodes?.nodes
      .filter(node => node.endorsementScore > 0)
      .sort((a, b) => Number(b.endorsementScore) - Number(a.endorsementScore))
  }, [nodes])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(currentRoundId)
  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])
  const endorseAppMutation = useEndorseApp({
    appId: xApp?.id ?? "",
    nodeId: selectedNodeId ?? "",
    userAddress: account?.address ?? "",
    onSuccess: handleSuccess,
  })

  const appScore = useMemo(() => Number(endorsementScore ?? 0), [endorsementScore])
  const newScore =
    appScore +
    Number(selectedNodeId ? nodesNotEndorsingApp?.find(node => node.id.toString() === selectedNodeId)?.endorsementScore : 0)

  const handleEndorsement = useCallback(() => {
    endorseAppMutation.sendTransaction()
  }, [endorseAppMutation])

  const shouldDisplayCooldownAlert = useMemo(() => {
    // TODO: Fetch isXNodeOnCooldown from contract
    return false // TODO: Placeholder
  }, [account, selectedNodeId, nodesNotEndorsingApp])

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={() => {
        setSelectedNodeId(null)
        onClose()
      }}>
      <VStack gap={6} align="flex-start" w="full">
        <Heading size="xl" fontWeight="bold">
          {t("Endorse {{appName}} app", { appName: xApp?.name })}
        </Heading>

        <Text
          as="span"
          textTransform="none"
          fontWeight="normal"
          whiteSpace="normal"
          wordBreak="break-word"
          flexWrap="wrap"
          textStyle="sm">
          {t("Select your node")}
        </Text>

        <VStack w="full" alignItems="stretch" gap={4}>
          <RadioGroup.Root onValueChange={details => setSelectedNodeId(details.value)} value={selectedNodeId}>
            <VStack w="full" gap={4} alignItems="stretch">
              {nodesNotEndorsingApp?.map((node: any) => (
                <Card.Root
                  key={node.nodeId}
                  variant="outline"
                  alignItems="flex-start"
                  flexDirection="row"
                  gap="8px"
                  p="16px"
                  rounded="8px">
                  <Card.Header p="0">
                    <Image src={node?.image} alt={node?.name} boxSize="62px" rounded="8px" />
                  </Card.Header>

                  <RadioGroup.Item
                    value={node.nodeId}
                    flex={1}
                    justifyContent="space-between"
                    alignItems="center"
                    flexDirection="row">
                    <Card.Body p="0" gap="0">
                      <Text textStyle="sm" _dark={{ color: "#FFFFFFB2" }}>
                        {t("Node")}
                      </Text>
                      <Text lineHeight={1.6} lineClamp={1}>
                        {`${node.name} #${node.nodeId}`}
                      </Text>
                      <Box w="fit-content" p="4px 8px" rounded="8px" bg="#F2F2F269">
                        <Text textStyle="xs" _dark={{ color: "#FFFFFFB2" }}>
                          {t("{{value}} points", { value: node.xNodePoints })}
                        </Text>
                      </Box>
                    </Card.Body>
                    <Card.Footer p="0">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                    </Card.Footer>
                  </RadioGroup.Item>
                </Card.Root>
              ))}
            </VStack>
          </RadioGroup.Root>

          <Text textStyle="sm" lineHeight={1} _dark={{ color: "#FFFFFFB2" }}>
            {t("Current app score: {{score}}", { score: appScore })}
            <br />
            {t("App score after endorsement: {{score}}", { score: newScore })}
          </Text>
        </VStack>

        {shouldDisplayCooldownAlert ? (
          <GenericAlert
            type="warning"
            isLoading={roundInfoLoading}
            message={t(
              "Once endorsed you cannot change your endorsement until the start of the next round, on {{roundStartDate}}.",
              {
                roundStartDate: dayjs(roundInfo?.voteEndTimestamp).format("MMMM D"),
              },
            )}
          />
        ) : null}

        <Skeleton w="full" loading={isUserNodesLoading}>
          <Button variant={"primary"} w={"full"} onClick={handleEndorsement} disabled={!selectedNodeId}>
            {t("Endorse now")}
          </Button>
        </Skeleton>
      </VStack>
    </BaseModal>
  )
}
