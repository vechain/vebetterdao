import {
  Box,
  Card,
  Flex,
  HStack,
  Icon,
  Image,
  Skeleton,
  Stack,
  Text,
  useMediaQuery,
  VStack,
  useDisclosure,
  Dialog,
  Portal,
  Heading,
} from "@chakra-ui/react"
import { UilArrowCircleUp, UilTimesCircle } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useGMMaxLevel } from "@/api/contracts/galaxyMember/hooks/useGMMaxLevel"
import { GmActionButton } from "@/components/GmActionButton"
import { gmNfts } from "@/constants/gmNfts"

import { UserGM } from "../../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { getLevelGradient } from "../../../../../api/contracts/galaxyMember/utils/getLevelGradient"
import { useGetB3trBalance } from "../../../../../hooks/useGetB3trBalance"

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
            <Icon as={UilTimesCircle} boxSize={isAbove800 ? "24px" : "16px"} color="brand.secondary-strong" />
            <HStack gap={0} alignItems={"baseline"}>
              <Text color="text.default" textStyle={isAbove800 ? "md" : "xs"}>
                {t("You reached the max GM NFT level")}
              </Text>
            </HStack>
          </HStack>
          <Text color="text.subtle" textStyle={isAbove800 ? "md" : "xs"}>
            {t("You can't upgrade your GM NFT anymore")}
          </Text>
        </>
      )
    }
    return (
      <>
        <HStack>
          <Icon
            as={UilArrowCircleUp}
            boxSize={isAbove800 ? "24px" : "16px"}
            color={{ base: "brand.secondary-strong", _dark: "brand.secondary" }}
          />
          <HStack gap={0} alignItems={"baseline"}>
            <Skeleton loading={isB3trBalanceLoading}>
              <Text
                color={{ base: "brand.secondary-strong", _dark: "brand.secondary" }}
                textStyle="lg"
                fontWeight="bold">
                {compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}
              </Text>
            </Skeleton>
            <Text color="text.default" textStyle={isAbove800 ? "md" : "xs"}>
              {"/"}
              {compactFormatter.format(Number(b3trToUpgrade))}
              {" B3TR"}
            </Text>
          </HStack>
        </HStack>
        <Text color="text.subtle" textStyle={isAbove800 ? "md" : "xs"}>
          {t("B3TR needed to upgrade your GM level")}
        </Text>
        {b3trLeftover > 0 && (
          <Text color="brand.secondary-strong" textStyle={isAbove800 ? "sm" : "xs"} fontWeight="semibold">
            {t("You have {{amount}} B3TR leftover from a previous upgrade", {
              amount: compactFormatter.format(Number(b3trLeftover)),
            })}
          </Text>
        )}
      </>
    )
  }, [b3trBalance?.scaled, b3trLeftover, b3trToUpgrade, gmMaxLevel, isAbove800, isB3trBalanceLoading, t, tokenLevel])

  return (
    <Card.Root p={0}>
      <Card.Body px={6} py={4}>
        <Stack
          direction={isAbove800 ? "row" : "column"}
          align={isAbove800 ? "stretch" : "flex-start"}
          gap={4}
          zIndex={"0"}>
          <HStack
            align={isAbove800 ? "stretch" : "center"}
            justify="space-between"
            rounded="12px"
            gap={6}
            flex={1}
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
              <Text textStyle={isAbove800 ? "md" : "xs"} lineClamp={1} color="text.subtle">
                {t("LEVEL {{level}}", { level: tokenLevel })}
              </Text>
              <Heading color="text.default" fontWeight="bold" lineClamp={1} size={isAbove800 ? "xl" : "md"}>
                {metadata?.name}
              </Heading>
              <HStack bg={{ base: "gray.100", _dark: "#FFFFFF4A" }} rounded="8px" padding="4px 8px" gap={1}>
                <Text color="text.default" textStyle={isAbove800 ? "md" : "xs"} fontWeight="semibold">
                  {multiplier}
                  {"x"}
                </Text>
                <Text color="text.default" textStyle={isAbove800 ? "md" : "xs"} lineClamp={1}>
                  {t("GM reward weight")}
                </Text>
              </HStack>
            </VStack>
          </HStack>
          <Flex w={isAbove800 ? "1px" : "full"} h={isAbove800 ? "auto" : "1px"} bg="border.primary" flexBasis={"1px"} />
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
                variant: "primary",
                w: "full",
                // boxShadow: "0px 0px 9.4px 0px #B1F16C",
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
      </Card.Body>
    </Card.Root>
  )
}
