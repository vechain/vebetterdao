import { CustomModalContent, TransactionModal } from "@/components"
import { CurveArrowIcon } from "@/components/Icons/CurveArrowIcon"
import { ThreeSparklesIcon } from "@/components/Icons/ThreeSparklesIcon"
import { ThreeTokensIcon } from "@/components/Icons/ThreeTokensIcon"
import { useAttachGMToXNode } from "@/hooks"
import {
  Flex,
  Modal,
  ModalOverlay,
  ModalBody,
  VStack,
  Box,
  Heading,
  Text,
  Button,
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
  Stack,
  useBreakpointValue,
  Hide,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react"
import { UilLink } from "@iconscout/react-unicons"
import { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useSelectedGmNft } from "@/api"
import { useSelectedTokenId } from "@/api/contracts/galaxyMember/hooks/useSelectedTokenId"
type Props = {
  isOpen: boolean
  onClose: () => void
}

export const AttachGMToXNodeModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isXNodeAttachedToGM } = useSelectedGmNft()
  const { data: selectedTokenId } = useSelectedTokenId()

  const attachGMToXNodeMutation = useAttachGMToXNode({
    onSuccess: onClose,
  })

  const handleAttachment = useCallback(() => {
    attachGMToXNodeMutation.resetStatus()
    attachGMToXNodeMutation.sendTransaction(undefined)
  }, [attachGMToXNodeMutation])

  useEffect(() => {
    if (!isXNodeAttachedToGM && selectedTokenId != null) {
      attachGMToXNodeMutation.resetStatus()
    }
  }, [isXNodeAttachedToGM, selectedTokenId])
  const iconSize = useBreakpointValue({ base: "48px", md: "108px" })
  if (attachGMToXNodeMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        successTitle={t("Attach GM to Node")}
        status={attachGMToXNodeMutation.error ? "error" : attachGMToXNodeMutation.status}
        errorDescription={attachGMToXNodeMutation.error?.reason}
        errorTitle={attachGMToXNodeMutation.error ? "Error attaching" : undefined}
        showTryAgainButton
        onTryAgain={handleAttachment}
        pendingTitle={"Attaching GM to XNode..."}
        showExplorerButton
        txId={attachGMToXNodeMutation.txReceipt?.meta.txID ?? attachGMToXNodeMutation.sendTransactionTx?.txid}
      />
    )

  const steps = [
    {
      Icon: ThreeTokensIcon,
      title: t("Attach"),
      description: t("Combine your GM NFT with your Node."),
    },
    {
      Icon: CurveArrowIcon,
      title: t("Free upgrade"),
      description: t("Your GM NFT will upgrade for free to a certain level depending on your Node"),
    },
    {
      Icon: ThreeSparklesIcon,
      title: t("Earn more rewards!"),
      description: t("You’ll have the reward multiplier of the level you upgrade to!"),
    },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"2xl"}>
      <ModalOverlay />
      <CustomModalContent>
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
                  key={index}
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
                  {t("Once the GM NFT is attached to your XNode, it can't be transferred anymore")}
                </AlertDescription>
              </Box>
            </Alert>
            <Button variant={"primaryAction"} w={"full"} onClick={handleAttachment} leftIcon={<UilLink />}>
              {t("Attach now!")}
            </Button>
          </VStack>
        </ModalFooter>
      </CustomModalContent>
    </Modal>
  )
}
