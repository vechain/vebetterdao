import { useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { PropsEndorsement } from "@/app/apps/components/UnendorseAppModal"
import { TransactionModal } from "@/components"
import { BaseModal } from "@/components/BaseModal"
import { useUnendorseApp } from "@/hooks"
import { Text, Button, Image, Flex, HStack, Icon, VStack, Heading, Box } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FaClock } from "react-icons/fa6"

type Props = {
  isOpen: boolean
  onClose: () => void
  appId: string
  endorserAddress: string
  nodeId: string
  nodePoints: string
}

export const UnendorseAppModalAdminsOnly = ({ isOpen, onClose, appId, endorserAddress, nodeId, nodePoints }: Props) => {
  const { t } = useTranslation()

  // App data
  const { data: appMetadata } = useXAppMetadata(appId ?? "")
  const { data: logo } = useIpfsImage(appMetadata?.logo)

  const unendorseAppMutation = useUnendorseApp({
    appId,
    nodeId,
    userAddress: endorserAddress,
    onSuccess: onClose,
  })

  const handleUnendorsement = useCallback(() => {
    unendorseAppMutation.resetStatus()
    unendorseAppMutation.sendTransaction(undefined)
  }, [unendorseAppMutation])

  const endorsementInfo: PropsEndorsement = {
    isUnendorsing: true,
    isEndorsing: false,
    points: nodePoints,
    endorsedAppName: appMetadata?.name,
  }
  if (unendorseAppMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        successTitle={t("Remove endorsement")}
        status={unendorseAppMutation.error ? "error" : unendorseAppMutation.status}
        errorDescription={unendorseAppMutation.error?.reason}
        errorTitle={unendorseAppMutation.error ? t("Transaction error") : undefined}
        showTryAgainButton
        onTryAgain={handleUnendorsement}
        pendingTitle={t("Removing endorsement...")}
        showExplorerButton
        txId={unendorseAppMutation.txReceipt?.meta.txID ?? unendorseAppMutation.sendTransactionTx?.txid}
        endorsementInfo={endorsementInfo}
      />
    )

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <VStack spacing={6} align="flex-start" w="full">
        <Heading fontSize="2xl">{t("Remove endorsement")}</Heading>

        <Flex position="relative" alignSelf={"center"}>
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
            {nodePoints}
          </Text>
        </Flex>
        <HStack bg="#FFF3E5" rounded="16px" py={6} px={4} spacing={4}>
          <Icon as={FaClock} boxSize={"36px"} color="#AF5F00" />
          <Box color="#AF5F00">
            <Text fontSize={"16px"} as="span">
              {t("If you remove these points")}
            </Text>{" "}
            <Text fontSize={"16px"} as="span" fontWeight="600">
              {t("your app may lose its endorsement")}
            </Text>
          </Box>
        </HStack>

        <VStack align="stretch" w="full">
          <Button variant={"dangerFilled"} w={"full"} onClick={handleUnendorsement}>
            {t("Remove endorsement")}
          </Button>
          <Button variant={"primaryGhost"} w={"full"} onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
