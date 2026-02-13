import { Alert, Box, Button, Heading, Text, VStack } from "@chakra-ui/react"
import { UilLink } from "@iconscout/react-unicons"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { v4 as uuid } from "uuid"

import { BaseModal } from "@/components/BaseModal"
import { CurveArrowIcon } from "@/components/Icons/CurveArrowIcon"
import { ThreeSparklesIcon } from "@/components/Icons/ThreeSparklesIcon"
import { ThreeTokensIcon } from "@/components/Icons/ThreeTokensIcon"
import { Tooltip } from "@/components/ui/tooltip"
import { gmNfts } from "@/constants/gmNfts"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import { useGetUserGMs } from "../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../constants/AnalyticsEvents"
import { useAttachGMToXNode } from "../../../hooks/galaxyMember/useAttachGMToXNode"
import { useGetLevelAfterAttachingNode } from "../hooks/useGetLevelAfterAttachingNode"

type Props = {
  gmId: string
  node?: UserNode
  isOpen: boolean
  onClose: () => void
}
export const AttachGMToXNodeModal = ({ gmId, node, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()

  const nodeTokenId = node?.id?.toString() ?? ""
  const hasValidNode = !!node && nodeTokenId !== ""

  const { data: levelAfterAttaching } = useGetLevelAfterAttachingNode({
    tokenId: gmId,
    nodeTokenId: hasValidNode ? nodeTokenId : "0",
  })

  const { data: userGMs, isLoading: isLoadingUserGMs } = useGetUserGMs()
  const gm = userGMs?.find(gm => gm.tokenId === gmId)
  const isNoAffectAttachment = !hasValidNode || (gm ? String(gm?.tokenLevel) === levelAfterAttaching : true)
  const levelAfterName = gmNfts.find(nft => nft.level === levelAfterAttaching)?.name
  const levelAfterMultiplier = gmNfts.find(nft => nft.level === levelAfterAttaching)?.multiplier

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const attachGMToXNodeMutation = useAttachGMToXNode({
    gmId,
    xNodeId: nodeTokenId,
    onSuccess: handleClose,
  })

  const handleAttachment = useCallback(() => {
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.ATTACHED_GM_TO_XNODE))
    attachGMToXNodeMutation.sendTransaction()
  }, [attachGMToXNodeMutation])

  const steps = [
    {
      Icon: ThreeTokensIcon,
      title: t("Attach your Node"),
      description: t("Link your VeChain Node to your GM NFT to unlock a free level upgrade."),
    },
    {
      Icon: CurveArrowIcon,
      title: t("Free upgrade to {{name}}", { name: levelAfterName }),
      description: t("Your GM NFT will jump to level {{level}} ({{name}}) — no B3TR required.", {
        level: levelAfterAttaching,
        name: levelAfterName,
      }),
    },
    {
      Icon: ThreeSparklesIcon,
      title: t("Earn {{multiplier}}x rewards", { multiplier: levelAfterMultiplier }),
      description: t(
        "A higher level means a bigger share of the GM Rewards Pool, which distributes 5% of weekly B3TR emissions to voters.",
      ),
    },
  ]

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={handleClose}
      ariaTitle={t("Attach Node to GM NFT")}
      showCloseButton={true}
      modalProps={{ size: "md" }}
      modalBodyProps={{ p: { base: 3, md: 5 } }}>
      <VStack align="stretch" gap={6}>
        <Heading textStyle="lg">{t("Attach Node to GM NFT")}</Heading>

        <VStack align="stretch" gap={4}>
          <Text textStyle="sm" color="text.subtle">
            {t(
              "VeChain Node holders can upgrade their GM NFT for free. Higher GM levels increase your reward weight, meaning you earn more B3TR when you vote.",
            )}
          </Text>
          <VStack align="stretch" gap={3}>
            {steps.map((step, index) => (
              <VStack
                key={`step-${uuid()}`}
                flex={1}
                bg="bg.subtle"
                p={{ base: 3, md: 6 }}
                borderRadius={{ base: "xl", md: "3xl" }}
                align="stretch">
                <VStack align="flex-start" gap={{ base: 0, md: 2 }}>
                  <Text textStyle="xs" color="text.subtle">
                    {t("STEP {{value}}", { value: index + 1 })}
                  </Text>
                  <Text textStyle="xl">{step.title}</Text>
                  <Text hideBelow="md" textStyle="sm" color="text.subtle">
                    {step.description}
                  </Text>
                </VStack>

                <Text hideFrom="md" textStyle="sm" color="text.subtle">
                  {step.description}
                </Text>
              </VStack>
            ))}
          </VStack>
        </VStack>

        <VStack align="stretch" w="full">
          <Alert.Root status="info" borderRadius={["xl", "xl", "3xl"]}>
            <Alert.Indicator w={5} h={5} />
            <Box textStyle="sm">
              <Alert.Description as="span">
                {t(
                  "Once attached, the GM NFT becomes non-transferable. You can detach it later, but your GM level may decrease.",
                )}
              </Alert.Description>
            </Box>
          </Alert.Root>

          <Tooltip
            disabled={!isNoAffectAttachment}
            content={t("This node does not provide a free upgrade for your current GM level.")}>
            <span>
              <Button
                loading={isLoadingUserGMs}
                disabled={isNoAffectAttachment}
                variant={"primary"}
                w={"full"}
                onClick={handleAttachment}>
                <UilLink />
                {t("Attach now!")}
              </Button>
            </span>
          </Tooltip>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
