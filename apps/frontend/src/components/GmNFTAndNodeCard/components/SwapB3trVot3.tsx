import { useB3trBalance, useVot3Balance } from "@/api"
import { ConvertModal } from "@/components/Convert/ConvertModal"
import { B3TRIcon } from "@/components/Icons"
import {
  Button,
  Heading,
  HStack,
  Image,
  Skeleton,
  Stack,
  StackProps,
  Text,
  useDisclosure,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { UilExchangeAlt } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import React from "react"
import { useTranslation } from "react-i18next"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useIsUserConnectedProfil } from "@/app/profile/components/utils/useIsUserConnectedProfil"

const compactFormatter = getCompactFormatter(4)
type Props = {
  containerProps?: StackProps
  innerContent?: React.ReactNode
  address: string
}

export const SwapB3trVot3 = ({ address, containerProps, innerContent }: Props) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useB3trBalance(address)
  const { data: vot3Balance, isLoading: isVot3BalanceLoading } = useVot3Balance(address)

  const { isOpen, onClose, onOpen } = useDisclosure()
  const hasNoBalance = (!b3trBalance || b3trBalance.scaled === "0") && (!vot3Balance || vot3Balance.scaled === "0")
  const isLoading = isB3trBalanceLoading || isVot3BalanceLoading

  const isSwapDisabled = isLoading || hasNoBalance
  const isConnectedUser = useIsUserConnectedProfil(address ?? "")

  return (
    <>
      <VStack flex="2" align={"stretch"} gap="24px" {...containerProps}>
        {innerContent}
        <Text fontSize="xl" fontWeight={700}>
          {t("{{value}} tokens", { value: isConnectedUser ? "Your" : `${humanAddress(address ?? "", 4, 3)}` })}
        </Text>
        <Stack gap="24px" direction={isAbove800 ? "row" : "column"}>
          <VStack
            align={"stretch"}
            flex="1"
            gap="8px"
            bg="#FFFFFF26"
            borderColor={"#FFFFFF33"}
            p="12px 16px"
            rounded="8px">
            <Text fontSize="sm" color="#FFFFFFB2">
              {t("Total B3TR Balance")}
            </Text>
            <HStack>
              <B3TRIcon boxSize={"30px"} />
              <Skeleton isLoaded={!isB3trBalanceLoading}>
                <Heading fontSize="1.75rem">{compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}</Heading>
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
            <Text fontSize="sm" color="#FFFFFFB2">
              {t("Total VOT3 Balance")}
            </Text>
            <HStack>
              <Image src={"/images/logo/vot3_logo_dark.svg"} boxSize={"30px"} alt="VOT3 Icon" />
              <Skeleton isLoaded={!isVot3BalanceLoading}>
                <Heading fontSize="1.75rem">{compactFormatter.format(Number(vot3Balance?.scaled ?? "0"))}</Heading>
              </Skeleton>
            </HStack>
          </VStack>
        </Stack>
        {isConnectedUser && (
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
            fontWeight={500}
            px="24px">
            {t("Convert tokens")}
          </Button>
        )}
      </VStack>
      <ConvertModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
