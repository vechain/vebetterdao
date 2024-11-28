import { useXNode } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { TransactionModal } from "@/components"
import { BaseModal } from "@/components/BaseModal"

import { useUnendorseApp } from "@/hooks"
import { Text, Button, Image, Flex, HStack, Icon, VStack, Heading, Box } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FaClock } from "react-icons/fa6"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export type PropsEndorsement = {
  isUnendorsing?: boolean
  isEndorsing?: boolean
  points?: number | string
  endorsedAppName?: string
  xNodeLevel?: number
}

export const UnendorseAppModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { endorsedApp, xNodeId, xNodePoints, xNodeLevel } = useXNode()
  const { data: logo } = useIpfsImage(endorsedApp?.logo)
  const { account } = useWallet()

  const unendorseAppMutation = useUnendorseApp({
    appId: endorsedApp?.id,
    nodeId: xNodeId,
    userAddress: account ?? "",
    onSuccess: () => {
      unendorseAppMutation.resetStatus()
      onClose()
    },
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
    xNodeLevel,
  }
  if (unendorseAppMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        successTitle={t("Unendorse app")}
        status={unendorseAppMutation.error ? "error" : unendorseAppMutation.status}
        errorDescription={unendorseAppMutation.error?.reason}
        errorTitle={unendorseAppMutation.error ? t("Transaction error") : undefined}
        showTryAgainButton
        onTryAgain={handleUnendorsement}
        pendingTitle={"Unendorsing app..."}
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
            {xNodePoints}
          </Text>
        </Flex>
        <HStack bg="#FFF3E5" rounded="16px" py={6} px={4} spacing={4}>
          <Icon as={FaClock} boxSize={"36px"} color="#AF5F00" />
          <Box color="#AF5F00">
            <Text fontSize={"16px"} as="span">
              {t("Removing your endorsement from an app may result in it")}
            </Text>{" "}
            <Text fontSize={"16px"} as="span" fontWeight="600">
              {t("no longer being selected for allocations.")}
            </Text>
          </Box>
        </HStack>

        <VStack align="stretch" w="full">
          <Button variant={"dangerFilled"} w={"full"} onClick={handleUnendorsement}>
            {t("Unendorse now")}
          </Button>
          <Button variant={"primaryGhost"} w={"full"} onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
