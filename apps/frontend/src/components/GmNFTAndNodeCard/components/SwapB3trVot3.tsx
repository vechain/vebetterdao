import { ConvertModal } from "@/components/Convert/components/Modal/ConvertModal"
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
import React from "react"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRetrieveProfilIdentity } from "@/app/profile/components/utils"
import { CountdownVoting } from "@/app/components/Countdown"
import { SnapshotExplainationModal } from "@/app/components/Countdown/SnapshotExplainationModal"
import { useDomainOrAddress, useGetB3trBalance, useGetVot3Balance } from "@/hooks"

const compactFormatter = getCompactFormatter(4)
type Props = {
  containerProps?: StackProps
  innerContent?: React.ReactNode
  address: string
}

export const SwapB3trVot3 = ({ address, containerProps, innerContent }: Props) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])
  const [isAbove600] = useMediaQuery(["(min-width: 600px)"])

  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useGetB3trBalance(address)
  const { data: vot3Balance, isLoading: isVot3BalanceLoading } = useGetVot3Balance(address)

  const { open: isOpen, onClose, onOpen } = useDisclosure()
  const hasNoBalance = (!b3trBalance || b3trBalance.scaled === "0") && (!vot3Balance || vot3Balance.scaled === "0")
  const isLoading = isB3trBalanceLoading || isVot3BalanceLoading

  const isSwapDisabled = isLoading || hasNoBalance

  const { isConnectedUser, domain, profile, isOnProfilePage } = useRetrieveProfilIdentity()
  const domainOrAddress = useDomainOrAddress({ domain: domain ?? "", address: profile ?? "" })

  const { open: isOpenSnapshot, onOpen: onOpenSnapshot, onClose: onCloseSnapshot } = useDisclosure()

  return (
    <>
      <VStack flex="2" align={"stretch"} gap="24px" {...containerProps}>
        {innerContent}
        <Stack
          direction={isAbove600 ? "row" : "column"}
          justify={"space-between"}
          align={isAbove600 ? "center" : "flex-start"}>
          <Text textStyle="xl" fontWeight="bold" color="text.strong">
            {t("{{value}} tokens", {
              value: isConnectedUser || !isOnProfilePage ? t("Your") : domainOrAddress,
            })}
          </Text>
          <CountdownVoting onOpen={onOpenSnapshot} />
          <SnapshotExplainationModal isOpen={isOpenSnapshot} onClose={onCloseSnapshot} />
        </Stack>
        <Stack gap="24px" direction={isAbove800 ? "row" : "column"}>
          <VStack
            align={"stretch"}
            flex="1"
            gap="8px"
            bg="#FFFFFF26"
            borderColor={"#FFFFFF33"}
            p="12px 16px"
            rounded="8px">
            <Text textStyle="sm" color="#FFFFFFB2">
              {t("Total B3TR Balance")}
            </Text>
            <HStack>
              <B3TRIcon boxSize={"30px"} />
              <Skeleton loading={isB3trBalanceLoading}>
                <Heading size="3xl" color="text.strong">
                  {compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}
                </Heading>
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
            <Text textStyle="sm" color="#FFFFFFB2">
              {t("Total VOT3 Balance")}
            </Text>
            <HStack>
              <Image src={"/assets/logos/vot3_logo_dark.svg"} boxSize={"30px"} alt="VOT3 Icon" />
              <Skeleton loading={isVot3BalanceLoading}>
                <Heading size="3xl" color="text.strong">
                  {compactFormatter.format(Number(vot3Balance?.scaled ?? "0"))}
                </Heading>
              </Skeleton>
            </HStack>
          </VStack>
        </Stack>
        {(isConnectedUser || !isOnProfilePage) && (
          <Button
            disabled={isSwapDisabled}
            onClick={onOpen}
            mt="auto"
            variant="primaryAction"
            rounded={"full"}
            fontWeight={500}
            px="24px">
            <UilExchangeAlt
              size={"16px"}
              style={{
                transform: "rotate(90deg)",
              }}
            />
            {t("Convert tokens")}
          </Button>
        )}
      </VStack>
      <ConvertModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
