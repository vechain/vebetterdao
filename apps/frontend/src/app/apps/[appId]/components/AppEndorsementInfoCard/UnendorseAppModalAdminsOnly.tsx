import { useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { BaseModal } from "@/components/BaseModal"
import { useRemoveNodeEndorsement } from "@/hooks"
import { Text, Button, Image, Flex, HStack, Icon, VStack, Heading, Box } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FaClock } from "react-icons/fa6"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

type Props = {
  isOpen: boolean
  onClose: () => void
  appId: string
  nodeId: string
  nodePoints: string
}

export const UnendorseAppModalAdminsOnly = ({ isOpen, onClose, appId, nodeId, nodePoints }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  // App data
  const { data: appMetadata } = useXAppMetadata(appId ?? "")
  const { data: logo } = useIpfsImage(appMetadata?.logo)

  const rmNodeEndorsementMutation = useRemoveNodeEndorsement({
    appId,
    nodeId,
    onSuccess: () => {
      rmNodeEndorsementMutation.resetStatus()
    },
  })

  const handleUnendorsement = useCallback(() => {
    rmNodeEndorsementMutation.resetStatus()
    rmNodeEndorsementMutation.sendTransaction()
  }, [rmNodeEndorsementMutation])

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={onClose}>
      <VStack gap={6} align="flex-start" w="full">
        <Heading textStyle="2xl">{t("Remove endorsement")}</Heading>

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
            textStyle="2xl"
            color="#D23F63">
            {"-"}
            {nodePoints}
          </Text>
        </Flex>
        <HStack bg="#FFF3E5" rounded="16px" py={6} px={4} gap={4}>
          <Icon as={FaClock} boxSize={"36px"} color="#AF5F00" />
          <Box color="#AF5F00">
            <Text textStyle={"md"} as="span">
              {t("Removing this endorsement from your app may result in it")}
            </Text>{" "}
            <Text textStyle={"md"} as="span" fontWeight="600">
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
