import {
  useAllocationsRound,
  useCurrentAllocationsRoundId,
  useUserEndorsementScore,
  useUserXNodes,
  useXAppMetadata,
  useXNodeCheckCooldown,
} from "@/api"
import { useSwitchEndorsement } from "@/hooks"
import { VStack, Heading, HStack, Box, Text, Button, Skeleton, Image } from "@chakra-ui/react"
import { UilClock } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { t } from "i18next"
import { useCallback, useMemo } from "react"
import { Trans } from "react-i18next"
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { BaseModal } from "@/components/BaseModal"
import { GenericAlert } from "@/app/components/Alert"
import dayjs from "dayjs"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
type Props = {
  isOpen: boolean
  onClose: () => void
  appIdToEndorse: string | undefined
  appIdToUnendorse: string | undefined
}

export const SwitchEndorsementAppModal = ({ appIdToEndorse, appIdToUnendorse, isOpen, onClose }: Props) => {
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
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
  const { data: userEndorsementScore, isLoading: isUserEndorsementScoreLoading } = useUserEndorsementScore(
    account?.address,
  )
  const userDelegatedNodes = useUserXNodes()

  const nodeId = userDelegatedNodes.data?.[0]?.id ?? "0"
  const { data: isXNodeOnCooldown } = useXNodeCheckCooldown(nodeId ?? "")
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(currentRoundId)

  const buttonTextSize = appToEndorseMetadata?.name && appToEndorseMetadata.name.length > 20 ? "12px" : "16px"

  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])

  //Mutation to switch endorsement
  //TODO: Multiple nodes
  const switchEndorsementMutation = useSwitchEndorsement({
    appIdToEndorse: appIdToEndorse ?? "",
    appIdToUnendorse: appIdToUnendorse ?? "",
    nodeId,
    onSuccess: handleSuccess,
  })

  const handleSwitchEndorsement = useCallback(() => {
    switchEndorsementMutation.sendTransaction()
  }, [switchEndorsementMutation])

  const shouldDisplayCooldownAlert = useMemo(() => {
    return account?.address && !isXNodeOnCooldown
  }, [account, isXNodeOnCooldown])

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={onClose}>
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
        {shouldDisplayCooldownAlert ? (
          <GenericAlert
            type="warning"
            isLoading={roundInfoLoading}
            message={t(
              "Once endorsed you cannot change your endorsement until the start of the next round, on {{roundStartDate}}.",
              {
                roundStartDate: dayjs(roundInfo?.voteEndTimestamp).format("MMMM D"),
              },
            )}
          />
        ) : null}

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
