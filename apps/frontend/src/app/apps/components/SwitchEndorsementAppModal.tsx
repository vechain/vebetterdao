import { useUserEndorsementScore, useUserXNodes, useXAppMetadata } from "@/api"
import { TransactionModal } from "@/components"
import { useSwitchEndorsement } from "@/hooks"
import { VStack, Heading, HStack, Box, Text, Button, Skeleton, Image } from "@chakra-ui/react"
import { UilClock } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/dapp-kit-react"
import { t } from "i18next"
import { useCallback } from "react"
import { Trans } from "react-i18next"
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { BaseModal } from "@/components/BaseModal"

type Props = {
  isOpen: boolean
  onClose: () => void
  appIdToEndorse: string | undefined
  appIdToUnendorse: string | undefined
}

export const SwitchEndorsementAppModal = ({ appIdToEndorse, appIdToUnendorse, isOpen, onClose }: Props) => {
  const { account } = useWallet()

  //Hooks to fetch app metadata
  const { data: appToUnendorseMetadata, isLoading: isAppToUnendorseMetadataLoading } = useXAppMetadata(
    appIdToUnendorse ?? "",
  )
  const { data: appToEndorseMetadata, isLoading: isAppToEndorseMetadataLoading } = useXAppMetadata(appIdToEndorse ?? "")

  const { data: appToUnendorseLogo, isLoading: isLogoLoading } = useIpfsImage(appToUnendorseMetadata?.logo)
  const { data: appToEndorseLogo, isLoading: isAppToEndorseLogoLoading } = useIpfsImage(appToEndorseMetadata?.logo)

  const isAppToUnendorseLoading = isAppToUnendorseMetadataLoading || isLogoLoading

  const isAppToEndorseLoading = isAppToEndorseMetadataLoading || isAppToEndorseLogoLoading

  //Hooks to fetch user endorsement score
  const { data: userEndorsementScore, isLoading: isUserEndorsementScoreLoading } = useUserEndorsementScore(account)
  const userDelegatedNodes = useUserXNodes()

  const nodeId = userDelegatedNodes.data?.[0]?.id ?? "0"

  const buttonTextSize = appToEndorseMetadata?.name && appToEndorseMetadata.name.length > 20 ? "12px" : "16px"

  //Mutation to switch endorsement
  //TODO: Multiple nodes
  const switchEndorsementMutation = useSwitchEndorsement({
    appIdToEndorse: appIdToEndorse ?? "",
    appIdToUnendorse: appIdToUnendorse ?? "",
    nodeId,
    onSuccess: () => {
      switchEndorsementMutation.resetStatus()
      onClose()
    },
  })

  const handleSwitchEndorsement = useCallback(() => {
    switchEndorsementMutation.resetStatus()
    switchEndorsementMutation.sendTransaction(undefined)
  }, [switchEndorsementMutation])

  if (switchEndorsementMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        status={switchEndorsementMutation.error ? "error" : switchEndorsementMutation.status}
        errorDescription={switchEndorsementMutation.error?.reason}
        errorTitle={switchEndorsementMutation.error ? t("Error switching endorsement") : undefined}
        showTryAgainButton
        onTryAgain={handleSwitchEndorsement}
        pendingTitle={t("Switching Endorsement...")}
        showExplorerButton
        txId={switchEndorsementMutation.txReceipt?.meta.txID ?? switchEndorsementMutation.sendTransactionTx?.txid}
      />
    )

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <VStack spacing={6} align="flex-start" w="full">
        <Heading fontSize={"24px"}>{t("Switch Your Endorsement to Another App")}</Heading>

        <HStack align={"center"} justifyContent={"space-around"} w={"full"} py="16px" px="10%" rounded={"md"}>
          <Skeleton isLoaded={!isAppToUnendorseLoading}>
            <Box position="relative" display="inline-block">
              <Image
                src={appToUnendorseLogo?.image ?? notFoundImage}
                alt={"App to Remove Endorsement"}
                boxSize={"107px"}
                borderRadius="16px"
              />
              <Heading position="absolute" top="-6" right="-6" color="#D23F63" fontSize="28px">
                {`- ${userEndorsementScore ?? 0}`}
              </Heading>
            </Box>
          </Skeleton>

          <ArrowRightIcon color="#C84968" />

          <Skeleton isLoaded={!isAppToEndorseLoading && !isUserEndorsementScoreLoading}>
            <Box position="relative" display="inline-block">
              <Image
                src={appToEndorseLogo?.image ?? notFoundImage}
                alt={"App to Endorse"}
                boxSize={"107px"}
                borderRadius="16px"
              />
              <Heading position="absolute" top="-6" right="-6" color="#3DBA67" fontSize="28px">
                {`+ ${userEndorsementScore ?? 0}`}
              </Heading>
            </Box>
          </Skeleton>
        </HStack>

        <Skeleton isLoaded={!isAppToEndorseLoading && !isUserEndorsementScoreLoading}>
          <Text
            as="span"
            textTransform="none"
            fontWeight="normal"
            whiteSpace="normal"
            wordBreak="break-word"
            flexWrap="wrap"
            fontSize="16px"
            color={"#6A6A6A"}>
            <Trans
              i18nKey={
                "To start endorsing <strong>{{appToEndorse}}</strong>, you’ll have to withdraw your endorsement from <strong>{{appToUnendorse}}</strong> first."
              }
              values={{ appToEndorse: appToEndorseMetadata?.name, appToUnendorse: appToUnendorseMetadata?.name }}
            />
          </Text>
        </Skeleton>

        <HStack spacing={3} align={"center"} w={"full"} p="16px" rounded={"16px"} bgColor={"#FFF3E5"}>
          <Box>
            <UilClock size={30} color="#AF5F00" />
          </Box>
          <Text color="#AF5F00">
            <Trans
              i18nKey={
                "Removing your endorsement from an app may result in it <strong>no longer being selected for allocations</strong>."
              }
            />
          </Text>
        </HStack>

        <Skeleton
          w={"full"}
          isLoaded={!isAppToEndorseLoading && !isAppToUnendorseLoading}
          justifyContent={"center"}
          justifyItems={"center"}
          alignContent={"center"}
          alignItems={"center"}>
          <Button variant={"primaryAction"} w={"full"} onClick={handleSwitchEndorsement} fontSize={buttonTextSize}>
            {t("Switch endorsement to {{appName}}", { appName: appToEndorseMetadata?.name })}
          </Button>
        </Skeleton>

        <Button variant={"link"} colorScheme="primary" w={"full"} onClick={onClose}>
          {t("Cancel")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
