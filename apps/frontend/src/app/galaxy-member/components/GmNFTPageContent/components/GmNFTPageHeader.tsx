import { useSelectedGmNft, useXNode } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { FeatureFlagWrapper } from "@/components"
import { GmActionButton } from "@/components/GmActionButton"
import { FeatureFlag } from "@/constants"
import {
  Box,
  Card,
  Flex,
  HStack,
  Image,
  Skeleton,
  Stack,
  Text,
  useMediaQuery,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
} from "@chakra-ui/react"
import { UilArrowCircleUp, UilTimesCircle } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { useGetB3trBalance } from "@/hooks"

const compactFormatter = getCompactFormatter(4)

export const GmNFTPageHeader = () => {
  const { t } = useTranslation()
  const {
    gmImage,
    gmName,
    gmRewardMultiplier,
    isGMLoading,
    gmLevel,
    b3trToUpgradeGMToNextLevel,
    isMaxGmLevelReached,
    isLoading,
    b3trLeftover,
  } = useSelectedGmNft()
  const [isAbove800] = useMediaQuery("(min-width: 800px)")
  const { account } = useWallet()
  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useGetB3trBalance(account?.address ?? "")

  const { isXNodeHolder, isXNodeDelegator, isXNodeAttachedToGM } = useXNode()

  const { isOpen, onOpen, onClose } = useDisclosure()

  const actionDescription = useMemo(() => {
    if (isXNodeHolder && !isXNodeAttachedToGM && !isXNodeDelegator) {
      return (
        <>
          <HStack>
            <UilArrowCircleUp size={isAbove800 ? "24px" : "16px"} color="#B1F16C" />
            <HStack gap={0} alignItems={"baseline"}>
              <FeatureFlagWrapper
                feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
                fallback={
                  <Text color="#FFFFFF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
                    {t("You will be able to attach GM NFT to this node")}
                  </Text>
                }>
                <Text color="#FFFFFF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
                  {t("You can attach GM NFT to this node")}
                </Text>
              </FeatureFlagWrapper>
            </HStack>
          </HStack>
          <FeatureFlagWrapper
            feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
            fallback={
              <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
                {t("Attach GM NFT to Node coming soon!")}
              </Text>
            }>
            <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
              {t("Attach GM NFT to Node")}
            </Text>
          </FeatureFlagWrapper>
        </>
      )
    }
    if (isMaxGmLevelReached) {
      return (
        <>
          <HStack>
            <UilTimesCircle size={isAbove800 ? "24px" : "16px"} color="#B1F16C" />
            <HStack gap={0} alignItems={"baseline"}>
              <FeatureFlagWrapper
                feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
                fallback={
                  <Text color="#FFFFFF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
                    {t("Upgrade your GM NFT coming soon!")}
                  </Text>
                }>
                <Text color="#FFFFFF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
                  {t("You reached the max GM NFT level")}
                </Text>
              </FeatureFlagWrapper>
            </HStack>
          </HStack>
          <FeatureFlagWrapper
            feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
            fallback={
              <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
                {t("You will be able to upgrade your GM NFT soon")}
              </Text>
            }>
            <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
              {t("You can't upgrade your GM NFT anymore")}
            </Text>
          </FeatureFlagWrapper>
        </>
      )
    }
    return (
      <>
        <HStack>
          <UilArrowCircleUp size={isAbove800 ? "24px" : "16px"} color="#B1F16C" />
          <HStack gap={0} alignItems={"baseline"}>
            <Skeleton isLoaded={!isB3trBalanceLoading}>
              <Text color="#B1F16C" fontSize="lg" fontWeight={700}>
                {compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}
              </Text>
            </Skeleton>
            <Text color="#FFFFFF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
              {"/"}
              {compactFormatter.format(Number(b3trToUpgradeGMToNextLevel))}
              {" B3TR"}
            </Text>
          </HStack>
        </HStack>
        <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
          {t("B3TR needed to upgrade your GM level")}
        </Text>
        {b3trLeftover > 0 && (
          <Text color="#B1F16C" fontSize={isAbove800 ? "sm" : "xs"} fontWeight={500}>
            {t("You have {{amount}} B3TR leftover from a previous upgrade", {
              amount: compactFormatter.format(Number(b3trLeftover)),
            })}
          </Text>
        )}
      </>
    )
  }, [
    b3trBalance?.scaled,
    b3trToUpgradeGMToNextLevel,
    b3trLeftover,
    isAbove800,
    isB3trBalanceLoading,
    isMaxGmLevelReached,
    isXNodeAttachedToGM,
    isXNodeHolder,
    t,
    isXNodeDelegator,
  ])

  return (
    <Card>
      <Image
        src={"/assets/backgrounds/nft-page-background.webp"}
        alt="gm-nft-header"
        position={"absolute"}
        w="100%"
        h="100%"
        rounded={"16px"}
      />
      <Stack
        direction={isAbove800 ? "row" : "column"}
        p={isAbove800 ? "24px" : "16px"}
        align={isAbove800 ? "stretch" : "flex-start"}
        spacing={4}
        zIndex={"0"}>
        <HStack
          align={isAbove800 ? "stretch" : "center"}
          justify="space-between"
          rounded="12px"
          gap={6}
          flex={1}
          color="#FFFFFF"
          flexGrow={4}>
          <Skeleton
            isLoaded={!isGMLoading}
            w={isAbove800 ? "132px" : "68px"}
            h={isAbove800 ? "132px" : "68px"}
            rounded="8px">
            <Box
              w={isAbove800 ? "132px" : "68px"}
              h={isAbove800 ? "132px" : "68px"}
              rounded="8px"
              bgGradient={getLevelGradient(Number(gmLevel))}
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={onOpen}
              cursor="pointer">
              <Skeleton
                isLoaded={!isLoading}
                w={isAbove800 ? "126px" : "64px"}
                h={isAbove800 ? "126px" : "64px"}
                rounded={"7px"}>
                <Image
                  src={gmImage}
                  alt="gm"
                  w={isAbove800 ? "126px" : "64px"}
                  h={isAbove800 ? "126px" : "64px"}
                  rounded="7px"
                />
              </Skeleton>
            </Box>
          </Skeleton>
          <VStack flex="1" align={"flex-start"} justify={"center"} gap={isAbove800 ? 2 : 1}>
            <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight="400" noOfLines={1} color="#FFFFFF80">
              {t("LEVEL {{level}}", { level: gmLevel })}
            </Text>
            <Text fontWeight={700} noOfLines={1} fontSize={isAbove800 ? "xl" : "md"}>
              {gmName}
            </Text>
            <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
              <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
                <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={600}>
                  {gmRewardMultiplier}
                </Text>
                <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={400} noOfLines={1}>
                  {t("GM reward weight")}
                </Text>
              </HStack>
            </FeatureFlagWrapper>
          </VStack>
        </HStack>
        <Flex w={isAbove800 ? "1px" : "full"} h={isAbove800 ? "auto" : "1px"} bg="#FFFFFF4D" flexBasis={"1px"} />
        <VStack
          align={"stretch"}
          justify={"center"}
          gap={isAbove800 ? 2 : 1}
          w={isAbove800 ? "auto" : "full"}
          flexGrow={1}>
          {actionDescription}
          <GmActionButton
            buttonProps={{
              variant: "tertiaryAction",
              w: "full",
              boxShadow: "0px 0px 9.4px 0px #B1F16C",
              color: "#080F1E",
              fontSize: "sm",
              h: "30px",
              mt: 2,
            }}
          />
        </VStack>
      </Stack>
      {/* Modal for Image Preview */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent
          as={motion.div}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: "0.3", ease: "easeOut" }}
          boxShadow="none"
          background="transparent"
          maxW="500px"
          w="full"
          p={0}
          m={0}>
          <ModalBody p={0}>
            <Box
              position="relative"
              display="flex"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
              bgGradient={getLevelGradient(Number(gmLevel))}
              p={1}
              rounded="16px">
              <Image src={gmImage} alt="gm" w="100%" h="100%" objectFit="cover" rounded="16px" />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  )
}
