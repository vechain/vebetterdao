import { useUserB3trBalance, useUserVot3Balance } from "@/api"
import { ConvertModal } from "@/components/Convert/ConvertModal"
import {
  Button,
  Heading,
  HStack,
  Image,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { UilExchangeAlt } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(4)

export const SwapB3trVot3 = () => {
  const { t } = useTranslation()
  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")

  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useUserB3trBalance()
  const { data: vot3Balance, isLoading: isVot3BalanceLoading } = useUserVot3Balance()

  const { isOpen, onClose, onOpen } = useDisclosure()
  const hasNoBalance = (!b3trBalance || b3trBalance.scaled === "0") && (!vot3Balance || vot3Balance.scaled === "0")
  const isLoading = isB3trBalanceLoading || isVot3BalanceLoading

  const isSwapDisabled = isLoading || hasNoBalance

  return (
    <>
      <VStack flex="2" align={"stretch"} gap="24px">
        <Text fontSize={"20px"} fontWeight={700}>
          {t("Your token balance")}
        </Text>
        <Stack gap="24px" direction={isAbove1200 ? "row" : "column"}>
          <VStack
            align={"stretch"}
            flex="1"
            gap="8px"
            bg="#FFFFFF26"
            borderColor={"#FFFFFF33"}
            p="12px 16px"
            rounded="8px">
            <Text fontSize={"14px"} color="#FFFFFFB2">
              {t("Total B3TR Balance")}
            </Text>
            <HStack>
              <Image src={"/images/logo/b3tr_logo_dark.svg"} boxSize={"30px"} alt="B3TR Icon" />
              <Skeleton isLoaded={!isB3trBalanceLoading}>
                <Heading fontSize={"28px"}>{compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}</Heading>
              </Skeleton>
            </HStack>
          </VStack>
          <VStack
            align={"stretch"}
            flex="1"
            gap="8px"
            bg="#FFFFFF26"
            borderColor={"#FFFFFF33"}
            p="12px 16px"
            rounded="8px">
            <Text fontSize={"14px"} color="#FFFFFFB2">
              {t("Total VOT3 Balance")}
            </Text>
            <HStack>
              <Image src={"/images/logo/vot3_logo_dark.svg"} boxSize={"30px"} alt="VOT3 Icon" />
              <Skeleton isLoaded={!isVot3BalanceLoading}>
                <Heading fontSize={"28px"}>{compactFormatter.format(Number(vot3Balance?.scaled ?? "0"))}</Heading>
              </Skeleton>
            </HStack>
          </VStack>
        </Stack>
        <Button
          isDisabled={isSwapDisabled}
          onClick={onOpen}
          leftIcon={
            <UilExchangeAlt
              size={"16px"}
              style={{
                transform: "rotate(90deg)",
              }}
            />
          }
          variant={"whiteAction"}
          rounded={"full"}
          fontSize="16px"
          fontWeight={500}
          px="24px">
          {t("Convert tokens")}
        </Button>
      </VStack>
      <ConvertModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
