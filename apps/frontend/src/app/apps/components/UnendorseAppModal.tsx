import { Text, Button, Image, Flex, Icon, VStack, Heading, Alert } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { ClockSolid } from "iconoir-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { BaseModal } from "@/components/BaseModal"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { useGetUserNodes, UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"
import { useUnendorseApp } from "../../../hooks/xApp/useUnendorseApp"
import { convertUriToUrl } from "../../../utils/uri"

type Props = {
  xNodeId: string
  isOpen: boolean
  onClose: () => void
}

export const UnendorseAppModal = ({ xNodeId, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: userNodesInfo } = useGetUserNodes()
  const node = userNodesInfo?.nodesManagedByUser?.find((node: UserNode) => node.id.toString() === xNodeId)
  const { data: appMetadata } = useXAppMetadata(node?.endorsedAppId ?? "")
  const endorsedApp = appMetadata
  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])
  const unendorseAppMutation = useUnendorseApp({
    appId: node?.endorsedAppId ?? "",
    nodeId: node?.id.toString() ?? "",
    userAddress: account?.address ?? "",
    onSuccess: handleSuccess,
  })

  const handleUnendorsement = useCallback(() => {
    unendorseAppMutation.sendTransaction()
  }, [unendorseAppMutation])

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
            src={endorsedApp?.logo ? convertUriToUrl(endorsedApp?.logo) : ""}
            alt={endorsedApp?.name ?? ""}
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
            color="status.negative.primary">
            {"-"}
            {node?.endorsementScore?.toString() ?? "0"}
          </Text>
        </Flex>

        <Alert.Root status="error" borderRadius={"lg"}>
          <Alert.Indicator asChild>
            <Icon as={ClockSolid} color="status.negative.primary" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>
              {t("Removing your endorsement from an app may result in it no longer being selected for allocations.")}
            </Alert.Title>
          </Alert.Content>
        </Alert.Root>
        <VStack align="stretch" w="full">
          <Button colorPalette="red" w={"full"} onClick={handleUnendorsement}>
            {t("Unendorse now")}
          </Button>
          <Button variant="ghost" color="status.negative.primary" w={"full"} onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
