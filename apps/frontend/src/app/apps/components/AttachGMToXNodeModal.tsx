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
      title: t("Attach"),
      description: t("Combine your GM NFT with your Node."),
    },
    {
      Icon: CurveArrowIcon,
      title: t("Free upgrade"),
      description: t("Your GM NFT will be level {{value}} after attaching.", { value: levelAfterAttaching }),
    },
    {
      Icon: ThreeSparklesIcon,
      title: t("Earn more rewards!"),
      description: t("You’ll have the reward multiplier of the level you upgrade to!"),
    },
  ]

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={handleClose}
      ariaTitle={t("Attaching Node to GM NFT")}
      showCloseButton={true}
      modalProps={{ size: "md" }}
      modalBodyProps={{ p: { base: 3, md: 5 } }}>
      <VStack align="stretch" gap={6}>
        <Heading textStyle="lg">{t("Attaching Node to GM NFT")}</Heading>

        <VStack align="stretch" gap={4}>
          <Text>{t("Upgrade your GM NFT for free with the help of your Node!")}</Text>
          <VStack align="stretch" gap={4}>
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
                {t("Once the GM NFT is attached to your Node, it can't be transferred anymore")}
              </Alert.Description>
            </Box>
          </Alert.Root>

          <Tooltip
            disabled={!isNoAffectAttachment}
            content={t("This feature is available only to nodes that provide free upgrade to GM NFTs.")}>
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
