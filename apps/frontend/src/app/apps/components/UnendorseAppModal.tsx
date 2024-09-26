import { useXNode } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { CustomModalContent, TransactionModal } from "@/components"

import { useUnendorseApp } from "@/hooks"
import {
  Modal,
  ModalOverlay,
  ModalBody,
  VStack,
  Heading,
  Text,
  Button,
  ModalCloseButton,
  ModalHeader,
  Image,
  Flex,
  ModalFooter,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export type PropsEndorsement = {
  isUnendorsing?: boolean
  isEndorsing?: boolean
  points?: number | string
  endorsedAppName?: string
}

export const UnendorseAppModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { endorsedApp, xNodeId, xNodePoints } = useXNode()
  const { data: logo } = useIpfsImage(endorsedApp?.logo)
  const { account } = useWallet()

  const unendorseAppMutation = useUnendorseApp({
    appId: endorsedApp?.id,
    nodeId: xNodeId,
    userAddress: account ?? "",
    onSuccess: onClose,
  })

  const handleUnendorsement = useCallback(() => {
    unendorseAppMutation.resetStatus()
    unendorseAppMutation.sendTransaction(undefined)
  }, [unendorseAppMutation])

  const endorsementInfo: PropsEndorsement = {
    isUnendorsing: true,
    isEndorsing: false,
    points: xNodePoints,
    endorsedAppName: endorsedApp?.name,
  }
  if (unendorseAppMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        successTitle={t("Unendorse app")}
        status={unendorseAppMutation.error ? "error" : unendorseAppMutation.status}
        errorDescription={unendorseAppMutation.error?.reason}
        errorTitle={unendorseAppMutation.error ? "Error unendorsing" : undefined}
        showTryAgainButton
        onTryAgain={handleUnendorsement}
        pendingTitle={"Unendorsing app..."}
        showExplorerButton
        txId={unendorseAppMutation.txReceipt?.meta.txID ?? unendorseAppMutation.sendTransactionTx?.txid}
        endorsementInfo={endorsementInfo}
      />
    )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton />
        <ModalHeader>
          <Heading fontSize="2xl">{t("Remove endorsement")}</Heading>
        </ModalHeader>
        <ModalBody>
          <VStack spacing={8}>
            <Flex position="relative">
              <Image src={logo?.image ?? ""} alt="app-logo" w="28" h="28" rounded="md" />
              <Text
                position="absolute"
                top={"-4"}
                right={"-4"}
                px={2}
                py={0.5}
                bg="white"
                borderRadius="full"
                fontSize="2xl"
                color="#D23F63"
                fontWeight="700">
                {"-"}
                {xNodePoints}
              </Text>
            </Flex>
            <Alert status="warning" variant="subtle" rounded="2xl">
              <AlertIcon w="9" h="9" />
              <VStack align="stretch" color="#AF5F00" gap={0}>
                <AlertDescription lineHeight={["1.5", "1.8"]} fontSize={["xs", "md"]}>
                  {t("Withdrawing your endorsement from an app may result in it")}
                </AlertDescription>
                <AlertDescription color="#AF5F00" lineHeight={["1.5", "1.8"]} fontSize={["xs", "md"]} fontWeight="bold">
                  {t("no longer being selected for allocations.")}
                </AlertDescription>
              </VStack>
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter w="full">
          <VStack align="stretch" w="full">
            <Button variant={"dangerFilled"} w={"full"} onClick={handleUnendorsement}>
              {t("Unendorse now")}
            </Button>
            <Button variant={"primaryGhost"} w={"full"} onClick={onClose}>
              {t("Cancel")}
            </Button>
          </VStack>
        </ModalFooter>
      </CustomModalContent>
    </Modal>
  )
}
