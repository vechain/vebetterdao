import { getGMLevel, useGetUserGMs, UserNode } from "@/api"
import { useGMMaxLevel } from "@/api/contracts/galaxyMember/hooks/useGMMaxLevel"
import { CustomModalContent } from "@/components"
import { CurveArrowIcon } from "@/components/Icons/CurveArrowIcon"
import { ThreeSparklesIcon } from "@/components/Icons/ThreeSparklesIcon"
import { ThreeTokensIcon } from "@/components/Icons/ThreeTokensIcon"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"
import { xNodeToGMstartingLevel } from "@/constants/gmNfts"
import { useAttachGMToXNode, useB3trDonated } from "@/hooks"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"
import { Alert, Box, Button, Flex, Heading, Dialog, Stack, Text, useBreakpointValue, VStack } from "@chakra-ui/react"
import { UilLink } from "@iconscout/react-unicons"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { v4 as uuid } from "uuid"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { Tooltip } from "@/components/ui/tooltip"

type Props = {
  gmId: string
  node?: UserNode
  isOpen: boolean
  onClose: () => void
}

export const AttachGMToXNodeModal = ({ gmId, node, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()

  const { data: b3trDonated } = useB3trDonated(gmId)
  const { data: gmMaxLevel } = useGMMaxLevel()
  const { data: userGMs, isLoading: isLoadingUserGMs } = useGetUserGMs()
  const gm = userGMs?.find(gm => gm.tokenId === gmId)

  const gmStartingLevel = useMemo(() => {
    const gmStartingLevel = xNodeToGMstartingLevel[node?.nodeLevel ?? 0]

    return Math.min(gmStartingLevel ?? 1, gmMaxLevel ?? 1)
  }, [gmMaxLevel, node?.nodeLevel])

  const levelAfterDetach = useMemo(() => {
    return getGMLevel(gmStartingLevel, Number(b3trDonated ?? 0))
  }, [b3trDonated, gmStartingLevel])

  const isNoAffectAttachment = gm ? gm?.tokenLevel === String(levelAfterDetach) : true

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
      description: t("Your GM NFT will be level {{value}} after attaching.", { value: levelAfterDetach }),
    },
    {
      Icon: ThreeSparklesIcon,
      title: t("Earn more rewards!"),
      description: t("You’ll have the reward multiplier of the level you upgrade to!"),
    },
  ]

  return (
    <Dialog.Root open={isOpen && !isTxModalOpen} onOpenChange={handleClose} size={"xl"}>
      <Dialog.Backdrop />
      <CustomModalContent p={{ base: 3, md: 5 }}>
        <Dialog.CloseTrigger />
        <Dialog.Header>
          <Heading fontSize="lg">{t("Attaching Node to GM NFT")}</Heading>
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
                      <Text fontSize="xs" color="#6A6A6A">
                        {t("STEP {{value}}", { value: index + 1 })}
                      </Text>
                      <Text fontSize="xl" fontWeight={700} color="#1E1E1E">
                        {step.title}
                      </Text>
                      <Text hideBelow="md" fontSize="sm" color="#6A6A6A">
                        {step.description}
                      </Text>
                    </VStack>
                  </Stack>
                  <Text hideFrom="md" fontSize="sm" color="#6A6A6A">
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
              <Box lineHeight={"1.20rem"} fontSize="sm">
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
                  variant={"primaryAction"}
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
