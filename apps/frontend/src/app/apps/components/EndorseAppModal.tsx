import {
  UnendorsedApp,
  useAppEndorsementScore,
  useEndorsementScoreThreshold,
  useUserDelegatedNodes,
  useUserEndorsementScore,
} from "@/api"
import { CustomModalContent, TransactionModal } from "@/components"
import { useEndorseApp } from "@/hooks"
import { Modal, ModalOverlay, ModalBody, VStack, Heading, HStack, Box, Text, Button } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { t } from "i18next"
import { useCallback } from "react"

type Props = {
  isOpen: boolean
  onClose: () => void
  xApp: UnendorsedApp
}

//TODO: Polish everything and align with figma
export const EndorseAppModal = ({ xApp, isOpen, onClose }: Props) => {
  const { account } = useWallet()
  const endorsementScore = useAppEndorsementScore(xApp.id)
  const endorsementScoreThreshold = useEndorsementScoreThreshold()

  const userDelegatedNodes = useUserDelegatedNodes(account)

  const nodeId = userDelegatedNodes.data?.[0] ?? "0"

  console.log({ nodeId })

  //TODO: Get the nodeId
  const endorseAppMutation = useEndorseApp({
    appId: xApp.id,
    nodeId,
    onSuccess: onClose,
  })

  //TODO: Handle multiple xNodes on UI
  const userEndorsementScore = useUserEndorsementScore(account)

  const newScore = (Number(endorsementScore.data) ?? 0) + (Number(userEndorsementScore.data) ?? 0)

  const handleEndorsement = useCallback(() => {
    endorseAppMutation.resetStatus()
    endorseAppMutation.sendTransaction(undefined)
  }, [endorseAppMutation])

  if (endorseAppMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        successTitle={t("Endorse app")}
        status={endorseAppMutation.error ? "error" : endorseAppMutation.status}
        errorDescription={endorseAppMutation.error?.reason}
        errorTitle={endorseAppMutation.error ? "Error endorsing" : undefined}
        showTryAgainButton
        onTryAgain={handleEndorsement}
        pendingTitle={"Endorsing app..."}
        showExplorerButton
        txId={endorseAppMutation.txReceipt?.meta.txID ?? endorseAppMutation.sendTransactionTx?.txid}
      />
    )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalBody w={"full"}>
          <VStack spacing={6} align="flex-start" w="full">
            <Heading size="lg">{t("Endorse app")}</Heading>
            <HStack
              spacing={3}
              align={"center"}
              w={"full"}
              justify={"space-between"}
              bg="#FAFAFA"
              p="16px"
              rounded={"md"}>
              <Box>
                <Text>{xApp.name}</Text>
                <Text color={"#6A6A6A"}>{t("Current endorsement score")}</Text>
              </Box>
              <Heading size="lg">
                {endorsementScore.data} {"/"} {endorsementScoreThreshold.data}
              </Heading>
            </HStack>
            <HStack
              spacing={3}
              align={"center"}
              w={"full"}
              justify={"space-between"}
              bg="#FAFAFA"
              p="16px"
              rounded={"md"}>
              <Box>
                <Text>{"TODO: Node Name"}</Text>
                <Text color={"#6A6A6A"}>{t("Your node")}</Text>
              </Box>
              <Heading size="lg">
                {t("{{first}} of {{second}}", {
                  first: userEndorsementScore.data,
                  second: endorsementScoreThreshold.data,
                })}
              </Heading>
            </HStack>
            <HStack
              spacing={3}
              align={"center"}
              w={"full"}
              justify={"space-between"}
              bg="#E9FDF1"
              p="16px"
              rounded={"md"}>
              <Box>
                <Text color={"#6A6A6A"}>{t("New dApp score")}</Text>
              </Box>
              <Heading size="lg" color="#3DBA67">
                {t("{{value}} pts.", { value: newScore })}
              </Heading>
            </HStack>
            <Button variant={"primaryAction"} w={"full"} onClick={handleEndorsement}>
              {t("Endorse now")}
            </Button>
          </VStack>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
