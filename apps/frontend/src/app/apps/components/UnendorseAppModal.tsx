import { useGetUserNodes, useNodesEndorsedApps } from "@/api"
import { BaseModal } from "@/components/BaseModal"

import { useUnendorseApp } from "@/hooks"
import { Text, Button, Image, Flex, HStack, Icon, VStack, Heading, Box } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FaClock } from "react-icons/fa6"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

type Props = {
  xNodeId: string
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

export const UnendorseAppModal = ({ xNodeId, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()

  const { data: nodes } = useGetUserNodes()
  const node = nodes?.allNodes?.find(node => node.nodeId === xNodeId)
  const { data: endorsedApps = [] } = useNodesEndorsedApps([xNodeId])
  const endorsedApp = endorsedApps[0]?.endorsedApp

  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])

  const unendorseAppMutation = useUnendorseApp({
    appId: endorsedApp?.id,
    nodeId: xNodeId,
    userAddress: account?.address ?? "",
    onSuccess: handleSuccess,
  })

  const handleUnendorsement = useCallback(() => {
    unendorseAppMutation.sendTransaction()
  }, [unendorseAppMutation])

  //TODO: Add this to review modal before sending transaction
  // const endorsementInfo: PropsEndorsement = {
  //   isUnendorsing: true,
  //   isEndorsing: false,
  //   points: xNodePoints,
  //   endorsedAppName: endorsedApp?.name,
  //   xNodeLevel,
  // }
  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}
      modalProps={{
        size: "lg",
      }}>
      <VStack gap={6} align="flex-start" w="full">
        <Heading textStyle="2xl">{t("Remove endorsement")}</Heading>

        <Flex position="relative" alignSelf={"center"}>
          <Image
            src={endorsedApp?.metadata?.logo ?? ""}
            alt={endorsedApp?.metadata?.name ?? ""}
            w="28"
            h="28"
            rounded="md"
          />
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
            {node?.xNodePoints}
          </Text>
        </Flex>
        <HStack bg="#FFF3E5" rounded="16px" py={6} px={4} gap={4}>
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
