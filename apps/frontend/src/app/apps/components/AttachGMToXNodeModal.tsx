import { getGMLevel, UserGM, UserNode } from "@/api"
import { useGMMaxLevel } from "@/api/contracts/galaxyMember/hooks/useGMMaxLevel"
import { CustomModalContent, BaseTooltip } from "@/components"
import { CurveArrowIcon } from "@/components/Icons/CurveArrowIcon"
import { ThreeSparklesIcon } from "@/components/Icons/ThreeSparklesIcon"
import { ThreeTokensIcon } from "@/components/Icons/ThreeTokensIcon"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"
import { xNodeToGMstartingLevel } from "@/constants/gmNfts"
import { useAttachGMToXNode, useB3trDonated } from "@/hooks"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  Heading,
  Hide,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react"
import { UilLink } from "@iconscout/react-unicons"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { v4 as uuid } from "uuid"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

type Props = {
  gm: UserGM
  node?: UserNode
  isOpen: boolean
  onClose: () => void
}

export const AttachGMToXNodeModal = ({ gm, node, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()

  const { data: b3trDonated } = useB3trDonated(gm.tokenId)
  const { data: gmMaxLevel } = useGMMaxLevel()

  const gmStartingLevel = useMemo(() => {
    const gmStartingLevel = xNodeToGMstartingLevel[node?.nodeLevel ?? 0]

    return Math.min(gmStartingLevel ?? 1, gmMaxLevel ?? 1)
  }, [gmMaxLevel, node?.nodeLevel])

  const levelAfterDetach = useMemo(() => {
    return getGMLevel(gmStartingLevel, Number(b3trDonated ?? 0))
  }, [b3trDonated, gmStartingLevel])

  const isNoAffectAttachment = gm.tokenLevel === String(levelAfterDetach)

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const attachGMToXNodeMutation = useAttachGMToXNode({
    gmId: gm.tokenId,
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
    <Modal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} size={"2xl"}>
      <ModalOverlay />
      <CustomModalContent p={{ base: 3, md: 5 }}>
        <ModalCloseButton />
        <ModalHeader>
          <Heading fontSize="lg">{t("Attaching Node to GM NFT")}</Heading>
        </ModalHeader>
        <ModalBody>
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
                      <Hide below="md">
                        <Text fontSize="sm" color="#6A6A6A">
                          {step.description}
                        </Text>
                      </Hide>
                    </VStack>
                  </Stack>
                  <Hide above="md">
                    <Text fontSize="sm" color="#6A6A6A">
                      {step.description}
                    </Text>
                  </Hide>
                </VStack>
              ))}
            </Stack>
          </VStack>
        </ModalBody>
        <ModalFooter w="full">
          <VStack align="stretch" w="full">
            <Alert status="info" borderRadius={["xl", "xl", "3xl"]}>
              <AlertIcon w={5} h={5} />
              <Box lineHeight={"1.20rem"} fontSize="sm">
                <AlertDescription as="span">
                  {t("Once the GM NFT is attached to your Node, it can't be transferred anymore")}
                </AlertDescription>
              </Box>
            </Alert>

            <BaseTooltip
              showTooltip={isNoAffectAttachment}
              text={t("This feature is available only to nodes that provide free upgrade to GM NFTs.")}>
              <span>
                <Button
                  disabled={isNoAffectAttachment}
                  variant={"primaryAction"}
                  w={"full"}
                  onClick={handleAttachment}
                  leftIcon={<UilLink />}>
                  {t("Attach now!")}
                </Button>
              </span>
            </BaseTooltip>
          </VStack>
        </ModalFooter>
      </CustomModalContent>
    </Modal>
  )
}
