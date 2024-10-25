import {
  UnendorsedApp,
  useAppEndorsementScore,
  useEndorsementScoreThreshold,
  useUserEndorsementScore,
  useUserXNodes,
  XApp,
} from "@/api"
import { TransactionModal } from "@/components"
import { useEndorseApp } from "@/hooks"
import { VStack, Heading, HStack, Box, Text, Button, Link, Skeleton, Icon } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"
import { PropsEndorsement } from "./UnendorseAppModal"
import { useWallet } from "@vechain/dapp-kit-react"
import { t } from "i18next"
import { useCallback, useMemo } from "react"
import { Trans } from "react-i18next"
import { BaseModal } from "@/components/BaseModal"

type Props = {
  isOpen: boolean
  onClose: () => void
  xApp: XApp | UnendorsedApp | undefined
}

export const EndorseAppModal = ({ xApp, isOpen, onClose }: Props) => {
  const { account } = useWallet()

  const { data: endorsementScore, isLoading: isAppScoreLoading } = useAppEndorsementScore(xApp?.id ?? "")
  const { data: endorsementScoreThreshold, isLoading: isEndorsementThresholdLoading } = useEndorsementScoreThreshold()

  const isEndorsementDataLoading = isAppScoreLoading || isEndorsementThresholdLoading

  const { data: userDelegatedNodes, isLoading: isUserNodesLoading } = useUserXNodes()

  const firstNode = userDelegatedNodes?.[0]

  const nodeId = userDelegatedNodes?.[0]?.id ?? "0"

  //TODO: Multiple nodes
  const endorseAppMutation = useEndorseApp({
    appId: xApp?.id ?? "",
    nodeId,
    userAddress: account ?? "",
    onSuccess: onClose,
  })

  //TODO: Handle multiple xNodes on UI
  const userEndorsementScore = useUserEndorsementScore(account)

  const appScore = useMemo(() => Number(endorsementScore ?? 0), [endorsementScore])
  const endorsementThreshold = useMemo(() => Number(endorsementScoreThreshold ?? 0), [endorsementScoreThreshold])
  const newScore = appScore + Number(userEndorsementScore.data ?? 0)

  const newScoreMetThreshold = useMemo(
    () => newScore >= endorsementThreshold && appScore < endorsementThreshold,
    [newScore, endorsementThreshold, appScore],
  )
  const handleEndorsement = useCallback(() => {
    endorseAppMutation.resetStatus()
    endorseAppMutation.sendTransaction(undefined)
  }, [endorseAppMutation])

  const endorsementInfo: PropsEndorsement = {
    isUnendorsing: false,
    isEndorsing: true,
    points: userEndorsementScore.data,
    endorsedAppName: xApp?.name,
  }

  if (endorseAppMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        successTitle={t("Endorse dApp")}
        status={endorseAppMutation.error ? "error" : endorseAppMutation.status}
        errorDescription={endorseAppMutation.error?.reason}
        errorTitle={endorseAppMutation.error ? "Error endorsing" : undefined}
        showTryAgainButton
        onTryAgain={handleEndorsement}
        pendingTitle={"Endorsing app..."}
        showExplorerButton
        txId={endorseAppMutation.txReceipt?.meta.txID ?? endorseAppMutation.sendTransactionTx?.txid}
        endorsementInfo={endorsementInfo}
      />
    )

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <VStack spacing={6} align="flex-start" w="full">
        <Heading size="lg">{t("Endorse dApp")}</Heading>
        <Text
          as="span"
          textTransform="none"
          fontWeight="normal"
          whiteSpace="normal"
          wordBreak="break-word"
          flexWrap="wrap"
          fontSize="sm">
          <Trans
            i18nKey={
              "As an X-Node holder, your unique NFT score can be used to endorse a single app of your choice within the ecosystem. <Link>Know more</Link>"
            }
            components={{
              Link: <Link href="" color="#004CFC" textDecoration="underline" />,
            }}
          />
        </Text>

        <Skeleton w="full" isLoaded={!isUserNodesLoading && !isEndorsementDataLoading}>
          <HStack
            spacing={3}
            align={"center"}
            w={"full"}
            justify={"space-between"}
            bg="#FAFAFA"
            p="16px"
            rounded={"md"}>
            <Box>
              <Text color={"#000000"} fontWeight={600}>
                {xApp?.name ?? ""}
              </Text>
              <Text color={"#6A6A6A"}>{t("Current endorsement score")}</Text>
            </Box>
            <HStack spacing={1} align={"flex-end"}>
              <Heading fontSize={"36px"} fontWeight={700} color={"#252525"} lineHeight={"36px"}>
                {appScore}
              </Heading>
              <Text fontSize={"14px"} color={"#6A6A6A"} fontWeight={400} lineHeight={"24px"}>
                {t("of {{value}}", {
                  value: endorsementScoreThreshold,
                })}
              </Text>
            </HStack>
          </HStack>
        </Skeleton>

        <Skeleton w="full" isLoaded={!isUserNodesLoading && !isEndorsementDataLoading}>
          <HStack
            spacing={3}
            align={"center"}
            w={"full"}
            justify={"space-between"}
            bg="#FAFAFA"
            p="16px"
            rounded={"md"}>
            <Box>
              <Text color={"#000000"} fontWeight={600}>
                {firstNode?.name}
              </Text>
              <Text color={"#6A6A6A"}>{t("Your X-node score")}</Text>
            </Box>
            <HStack spacing={1} align={"flex-end"}>
              <Text
                as="span"
                textTransform="none"
                fontWeight={400}
                color={"#6A6A6A"}
                whiteSpace="normal"
                wordBreak="break-word"
                flexWrap="wrap"
                fontSize="sm">
                <Trans
                  i18nKey="{{value}} pts."
                  values={{ value: userEndorsementScore?.data || 0 }}
                  components={{
                    Text: (
                      <Heading as="span" fontSize={"36px"} fontWeight={700} color={"#252525"} lineHeight={"36px"} />
                    ),
                  }}
                />
              </Text>
            </HStack>
          </HStack>
        </Skeleton>
        <Skeleton w="full" isLoaded={!isUserNodesLoading && !isEndorsementDataLoading}>
          <HStack
            spacing={3}
            align={"center"}
            w={"full"}
            justify={"space-between"}
            bg="#E9FDF1"
            p="16px"
            rounded={"md"}>
            <Box>
              <Text color={"#000000"} fontWeight={600}>
                {t("New dApp score")}
              </Text>
            </Box>
            <Text
              as="span"
              color="#6A6A6A"
              fontWeight={400}
              textTransform="none"
              whiteSpace="normal"
              wordBreak="break-word"
              flexWrap="wrap"
              fontSize="sm">
              <Trans
                i18nKey="{{value}} pts."
                values={{ value: newScore }}
                components={{
                  Text: <Heading as="span" size="lg" color="#3DBA67" />,
                }}
              />
            </Text>
          </HStack>
        </Skeleton>
        {newScoreMetThreshold ? (
          <HStack spacing={4} align={"center"} w={"full"}>
            <Icon as={UilExclamationCircle} boxSize="24px" color="#252525" />
            <Text color="black">
              {t("With your endorsement, {{appName}} gets enough score to get into the next allocation round.", {
                appName: xApp?.name,
              })}
            </Text>
          </HStack>
        ) : null}
        <Skeleton w="full" isLoaded={!isUserNodesLoading && !isEndorsementDataLoading}>
          <Button variant={"primaryAction"} w={"full"} onClick={handleEndorsement}>
            {t("Endorse now")}
          </Button>
        </Skeleton>
      </VStack>
    </BaseModal>
  )
}
