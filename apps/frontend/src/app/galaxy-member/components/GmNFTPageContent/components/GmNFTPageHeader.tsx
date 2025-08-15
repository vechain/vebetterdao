import { UserGM } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { GmActionButton } from "@/components/GmActionButton"
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
  Dialog,
  Portal,
} from "@chakra-ui/react"
import { UilArrowCircleUp, UilTimesCircle } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useGetB3trBalance } from "@/hooks"
import { gmNfts } from "@/constants/gmNfts"
import { useGMMaxLevel } from "@/api/contracts/galaxyMember/hooks/useGMMaxLevel"

const compactFormatter = getCompactFormatter(4)

export const GmNFTPageHeader = ({ gm }: { gm: UserGM }) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])
  const { account } = useWallet()
  const { open: isOpen, onOpen, onClose } = useDisclosure()

  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useGetB3trBalance(account?.address ?? "")
  const { data: gmMaxLevel } = useGMMaxLevel()

  const { multiplier = 0, tokenLevel, b3trToUpgrade, metadata } = gm
  const b3trLeftover = Number(gmNfts[Number(tokenLevel)]?.b3trToUpgrade || 0) - Number(b3trToUpgrade)

  const actionDescription = useMemo(() => {
    if (Number(tokenLevel) >= (gmMaxLevel ?? 0)) {
      return (
        <>
          <HStack>
            <UilTimesCircle size={isAbove800 ? "24px" : "16px"} color="#B1F16C" />
            <HStack gap={0} alignItems={"baseline"}>
              <Text color="#FFFFFF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
                {t("You reached the max GM NFT level")}
              </Text>
            </HStack>
          </HStack>
          <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
            {t("You can't upgrade your GM NFT anymore")}
          </Text>
        </>
      )
    }
    return (
      <>
        <HStack>
          <UilArrowCircleUp size={isAbove800 ? "24px" : "16px"} color="#B1F16C" />
          <HStack gap={0} alignItems={"baseline"}>
            <Skeleton loading={isB3trBalanceLoading}>
              <Text color="#B1F16C" fontSize="lg" fontWeight={700}>
                {compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}
              </Text>
            </Skeleton>
            <Text color="#FFFFFF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
              {"/"}
              {compactFormatter.format(Number(b3trToUpgrade))}
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
  }, [b3trBalance?.scaled, b3trLeftover, b3trToUpgrade, gmMaxLevel, isAbove800, isB3trBalanceLoading, t, tokenLevel])

  return (
    <Card.Root>
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
        gap={4}
        zIndex={"0"}>
        <HStack
          align={isAbove800 ? "stretch" : "center"}
          justify="space-between"
          rounded="12px"
          gap={6}
          flex={1}
          color="#FFFFFF"
          flexGrow={4}>
          <Box
            w={isAbove800 ? "132px" : "68px"}
            h={isAbove800 ? "132px" : "68px"}
            rounded="8px"
            bgGradient={getLevelGradient(Number(tokenLevel))}
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={onOpen}
            cursor="pointer">
            <Image
              src={metadata?.image}
              alt="gm"
              w={isAbove800 ? "126px" : "64px"}
              h={isAbove800 ? "126px" : "64px"}
              rounded="7px"
            />
          </Box>

          <VStack flex="1" align={"flex-start"} justify={"center"} gap={isAbove800 ? 2 : 1}>
            <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight="400" lineClamp={1} color="#FFFFFF80">
              {t("LEVEL {{level}}", { level: tokenLevel })}
            </Text>
            <Text fontWeight={700} lineClamp={1} fontSize={isAbove800 ? "xl" : "md"}>
              {metadata?.name}
            </Text>
            <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
              <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={600}>
                {multiplier}
                {"x"}
              </Text>
              <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={400} lineClamp={1}>
                {t("GM reward weight")}
              </Text>
            </HStack>
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
            b3trBalanceScaled={b3trBalance?.scaled}
            buttonProps={{
              variant: "whiteAction",
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
      <Dialog.Root
        open={isOpen}
        onOpenChange={details => {
          if (!details.open) {
            onClose()
          }
        }}
        placement="center"
        size="xl">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content boxShadow="none" background="transparent" maxW="500px" w="full" p={0} m={0}>
              <Dialog.Body p={0}>
                <Box
                  position="relative"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  overflow="hidden"
                  bgGradient={getLevelGradient(Number(tokenLevel))}
                  p={1}
                  rounded="16px">
                  <Image src={metadata?.image} alt="gm" w="100%" h="100%" objectFit="cover" rounded="16px" />
                </Box>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Card.Root>
  )
}
