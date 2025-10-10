import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  Dialog,
  Stack,
  Text,
  useBreakpointValue,
  VStack,
  CloseButton,
} from "@chakra-ui/react"
import { UilLink } from "@iconscout/react-unicons"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { v4 as uuid } from "uuid"

import { CurveArrowIcon } from "@/components/Icons/CurveArrowIcon"
import { ThreeSparklesIcon } from "@/components/Icons/ThreeSparklesIcon"
import { ThreeTokensIcon } from "@/components/Icons/ThreeTokensIcon"
import { Tooltip } from "@/components/ui/tooltip"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import { useGetUserGMs } from "../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"
import { CustomModalContent } from "../../../components/CustomModalContent"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../constants/AnalyticsEvents"
import { useAttachGMToXNode } from "../../../hooks/useAttachGMToXNode"
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
  const { data: levelAfterAttaching } = useGetLevelAfterAttachingNode({
    tokenId: gmId,
    nodeTokenId: node?.nodeId ?? "",
  })
  const { data: userGMs, isLoading: isLoadingUserGMs } = useGetUserGMs()
  const gm = userGMs?.find(gm => gm.tokenId === gmId)
  const isNoAffectAttachment = gm ? String(gm?.tokenLevel) === levelAfterAttaching : true

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const attachGMToXNodeMutation = useAttachGMToXNode({
    gmId,
    xNodeId: node?.nodeId ?? "",
    onSuccess: handleClose,
  })

  const handleAttachment = useCallback(() => {
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.ATTACHED_GM_TO_XNODE))
    attachGMToXNodeMutation.sendTransaction()
  }, [attachGMToXNodeMutation])

  const iconSize = useBreakpointValue({ base: "48px", md: "108px" })

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
    <Dialog.Root open={isOpen && !isTxModalOpen} onOpenChange={handleClose} size={"xl"}>
      <CustomModalContent p={{ base: 3, md: 5 }}>
        <Dialog.CloseTrigger asChild>
          <CloseButton />
        </Dialog.CloseTrigger>
        <Dialog.Header>
          <Heading textStyle="lg">{t("Attaching Node to GM NFT")}</Heading>
        </Dialog.Header>
        <Dialog.Body>
          <VStack align="stretch" gap={4}>
            <Text>{t("Upgrade your GM NFT for free with the help of your Node!")}</Text>
            <Stack align="stretch" direction={["column", "column", "row"]}>
              {steps.map((step, index) => (
                <VStack
                  key={`step-${uuid()}`}
                  flex={1}
                  bg="#FAFAFA"
                  p={[3, 3, 6]}
                  borderRadius={["xl", "xl", "3xl"]}
                  align="stretch">
                  <Stack align="stretch" direction={["row", "row", "column"]}>
                    <Flex flexBasis={["48px", "48px", "108px"]}>
                      <step.Icon size={iconSize} />
                    </Flex>
                    <VStack align="flex-start" gap={[0, 0, 2]}>
                      <Text textStyle="xs" color="text.subtle">
                        {t("STEP {{value}}", { value: index + 1 })}
                      </Text>
                      <Text textStyle="xl" color="#1E1E1E">
                        {step.title}
                      </Text>
                      <Text hideBelow="md" textStyle="sm" color="text.subtle">
                        {step.description}
                      </Text>
                    </VStack>
                  </Stack>
                  <Text hideFrom="md" textStyle="sm" color="text.subtle">
                    {step.description}
                  </Text>
                </VStack>
              ))}
            </Stack>
          </VStack>
        </Dialog.Body>
        <Dialog.Footer w="full">
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
        </Dialog.Footer>
      </CustomModalContent>
    </Dialog.Root>
  )
}
