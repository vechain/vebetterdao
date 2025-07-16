import {
  UnendorsedApp,
  useAllocationsRound,
  useAppEndorsementScore,
  useCurrentAllocationsRoundId,
  XApp,
  useGetUserNodes,
} from "@/api"
import { useEndorseApp } from "@/hooks"
import {
  VStack,
  Heading,
  Box,
  Text,
  Button,
  Skeleton,
  Card,
  CardHeader,
  CardBody,
  Image,
  Radio,
  RadioGroup,
} from "@chakra-ui/react"

import { useWallet } from "@vechain/vechain-kit"
import { t } from "i18next"
import { useCallback, useMemo, useState } from "react"

import { BaseModal } from "@/components/BaseModal"
import { GenericAlert } from "@/app/components/Alert"
import dayjs from "dayjs"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

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
    return nodes?.allNodes
      .filter(node => !node.endorsedAppId && node.xNodePoints > 0)
      .sort((a, b) => Number(b.xNodePoints) - Number(a.xNodePoints))
  }, [nodes])

  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()

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
    Number(selectedNodeId ? nodesNotEndorsingApp?.find(node => node.nodeId === selectedNodeId)?.xNodePoints : 0)

  const handleEndorsement = useCallback(() => {
    endorseAppMutation.sendTransaction()
  }, [endorseAppMutation])

  const shouldDisplayCooldownAlert = useMemo(() => {
    const selectedNode = nodesNotEndorsingApp?.find(node => node.nodeId === selectedNodeId)
    return account?.address && selectedNode && !selectedNode?.isXNodeOnCooldown
  }, [account, selectedNodeId, nodesNotEndorsingApp])

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={() => {
        setSelectedNodeId(undefined)
        onClose()
      }}>
      <VStack spacing={6} align="flex-start" w="full">
        <Heading size="lg">{t("Endorse {{appName}} dApp", { appName: xApp?.name })}</Heading>

        <Text
          as="span"
          textTransform="none"
          fontWeight="normal"
          whiteSpace="normal"
          wordBreak="break-word"
          flexWrap="wrap"
          fontSize="sm">
          {t("Select your node")}
        </Text>

        <VStack w="full" alignItems="stretch" spacing={4}>
          <RadioGroup onChange={setSelectedNodeId} value={selectedNodeId}>
            <VStack w="full" spacing={4} alignItems="stretch">
              {nodesNotEndorsingApp?.map(node => (
                <Card
                  key={node.nodeId}
                  alignItems="flex-start"
                  direction="row"
                  gap="8px"
                  bg="#FFFFFF26"
                  borderColor={"#FFFFFF33"}
                  p="16px"
                  rounded="8px">
                  <CardHeader p="0">
                    <Image
                      src={node?.image}
                      fallbackSrc="/assets/icons/not-found-image-fallback.svg"
                      alt={node?.name}
                      boxSize="62px"
                      rounded="8px"
                    />
                  </CardHeader>

                  <Radio value={node.nodeId} flex={1} justifyContent="space-between" flexDirection="row-reverse">
                    <CardBody p="0" gap="8px" textAlign="left">
                      <Text fontSize="sm" lineHeight={1} color="#FFFFFFB2">
                        {t("Node")}
                      </Text>

                      <Text fontWeight={700} lineHeight={1.6} noOfLines={1}>
                        {`${node.name} #${node.nodeId}`}
                      </Text>

                      <Box display="inline-block" p="4px 8px" rounded="8px" bg="#F2F2F269">
                        <Text fontSize="xs" color="#FFFFFFB2" textColor="white">
                          {t("{{value}} points", { value: node.xNodePoints })}
                        </Text>
                      </Box>
                    </CardBody>
                  </Radio>
                </Card>
              ))}
            </VStack>
          </RadioGroup>

          <Text fontSize="sm" lineHeight={1} color="#FFFFFFB2">
            {t("Current DApp score: {{score}}", { score: appScore })}
            <br />
            {t("DApp score after endorsement: {{score}}", { score: newScore })}
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

        <Skeleton w="full" isLoaded={!isUserNodesLoading}>
          <Button variant={"primaryAction"} w={"full"} onClick={handleEndorsement} isDisabled={!selectedNodeId}>
            {t("Endorse now")}
          </Button>
        </Skeleton>
      </VStack>
    </BaseModal>
  )
}
