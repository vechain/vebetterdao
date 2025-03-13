import { useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { TransactionModal, TransactionModalStatus } from "@/components"
import { BaseModal } from "@/components/BaseModal"
import { useRemoveNodeEndorsement } from "@/hooks"
import { Text, Button, Image, Flex, HStack, Icon, VStack, Heading, Box } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FaClock } from "react-icons/fa6"

type Props = {
  isOpen: boolean
  onClose: () => void
  appId: string
  nodeId: string
  nodePoints: string
}

export const UnendorseAppModalAdminsOnly = ({ isOpen, onClose, appId, nodeId, nodePoints }: Props) => {
  const { t } = useTranslation()

  // App data
  const { data: appMetadata } = useXAppMetadata(appId ?? "")
  const { data: logo } = useIpfsImage(appMetadata?.logo)

  const rmNodeEndorsementMutation = useRemoveNodeEndorsement({
    appId,
    nodeId,
    onSuccess: () => {
      rmNodeEndorsementMutation.resetStatus()
      onClose()
    },
  })

  const handleUnendorsement = useCallback(() => {
    rmNodeEndorsementMutation.resetStatus()
    rmNodeEndorsementMutation.sendTransaction(undefined)
  }, [rmNodeEndorsementMutation])

  if (rmNodeEndorsementMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        successTitle={t("Remove endorsement")}
        status={
          rmNodeEndorsementMutation.error
            ? TransactionModalStatus.Error
            : (rmNodeEndorsementMutation.status as TransactionModalStatus)
        }
        errorDescription={rmNodeEndorsementMutation.error?.reason}
        errorTitle={rmNodeEndorsementMutation.error ? t("Transaction error") : undefined}
        onTryAgain={handleUnendorsement}
        pendingTitle={t("Removing endorsement...")}
        showExplorerButton
        txId={rmNodeEndorsementMutation.txReceipt?.meta.txID}
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
              {t("Removing this endorsement from your app may result in it")}
            </Text>{" "}
            <Text fontSize={"16px"} as="span" fontWeight="600">
              {t("no longer being selected for allocations.")}
            </Text>
          </Box>
        </HStack>

        <VStack align="stretch" w="full">
          <Button variant={"dangerFilled"} w={"full"} onClick={handleUnendorsement}>
            {t("Remove now")}
          </Button>
          <Button variant={"primaryGhost"} w={"full"} onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
