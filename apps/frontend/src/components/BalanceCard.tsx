import { useB3trBalance, useVot3Balance } from "@/api"
import {
  Card,
  CardBody,
  Heading,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  Show,
  Flex,
  Text,
  useColorModeValue,
  Divider,
  Spinner,
  Icon,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { B3TRIcon, VOT3Icon } from "./Icons"
import { SwapButton } from "./Swap/SwapButton"
import { useTokenColors } from "@/hooks"
import { BaseTooltip } from "./BaseTooltip"
import { FaCircleInfo } from "react-icons/fa6"

const DECIMAL_PLACES = 4

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: DECIMAL_PLACES,
})

type Props = {}
/**
 * BalanceCard displays the balance of the current account
 * @returns BalanceCard
 */
export const BalanceCard: React.FC<Props> = () => {
  const { account } = useWallet()

  const { b3trBgGradient, vot3BgGradient } = useTokenColors()
  const dividerColor = useColorModeValue("500", "600")

  const {
    data: b3trBalance,
    isLoading: b3trBalanceLoading,
    error: b3trBalanceError,
  } = useB3trBalance(account ?? undefined)
  const {
    data: vot3Balance,
    isLoading: vot3BalanceLoading,
    error: vot3BalanceError,
  } = useVot3Balance(account ?? undefined)

  const b3trBalanceScaled = useMemo(() => {
    return b3trBalance?.scaled ?? "0"
  }, [b3trBalance])

  const vot3BalanceScaled = useMemo(() => {
    return vot3Balance?.scaled ?? "0"
  }, [vot3Balance])

  const isLoading = b3trBalanceLoading || vot3BalanceLoading

  const hasNoBalance = useMemo(() => {
    return b3trBalance?.scaled === "0" && vot3Balance?.scaled === "0"
  }, [b3trBalance, vot3Balance])

  if (b3trBalanceError || vot3BalanceError)
    return (
      <Alert status="error" borderRadius={"lg"}>
        <AlertIcon />
        <AlertTitle>Error fetching your balances</AlertTitle>
        <AlertDescription>{b3trBalanceError?.message ?? vot3BalanceError?.message}</AlertDescription>
      </Alert>
    )

  const balances = (
    <VStack w={"full"}>
      <HStack
        bgGradient={b3trBgGradient}
        py={6}
        px={6}
        h="full"
        w="full"
        borderRadius={"2xl"}
        align="flex-start"
        spacing={12}>
        <HStack align={"stretch"} justify={"stretch"} spacing={4}>
          <Divider
            orientation="vertical"
            variant="thick"
            w="4px"
            bgColor={`primary.${dividerColor}`}
            h="auto"
            borderRadius="7px"
          />
          <VStack align="self-start">
            <B3TRIcon boxSize="32px" />
            <Heading size="2xl" fontWeight={900}>
              {compactFormatter.format(Number(b3trBalanceScaled))}
            </Heading>
            <Text fontSize="16px" fontWeight="500">
              B3TR Tokens
            </Text>
          </VStack>
        </HStack>
      </HStack>
      <HStack
        bgGradient={vot3BgGradient}
        py={6}
        px={6}
        h="full"
        w="full"
        borderRadius={"2xl"}
        align="flex-start"
        spacing={12}>
        <HStack align={"stretch"} justify={"stretch"} spacing={4} w={"full"}>
          <Divider
            orientation="vertical"
            variant="thick"
            w="4px"
            bgColor={`secondary.${dividerColor}`}
            h="auto"
            borderRadius="7px"
          />
          <VStack align="self-start" w="full">
            <HStack w={"full"} justifyContent={"space-between"}>
              <VOT3Icon boxSize={"32px"} />
              <BaseTooltip
                text={
                  "Your VOT3 swap limit is determined by your previous B3TR conversions, ensuring fairness in token swaps."
                }>
                <span>
                  <Icon as={FaCircleInfo} position={"relative"} />
                </span>
              </BaseTooltip>
            </HStack>
            <Heading size="2xl" fontWeight={900}>
              {compactFormatter.format(Number(vot3BalanceScaled))}
            </Heading>
            <Text fontSize="16px" fontWeight="500">
              VOT3 Tokens
            </Text>
          </VStack>
        </HStack>
      </HStack>
    </VStack>
  )

  return (
    <Card w="full">
      <CardBody>
        <VStack spacing={4} align="flex-start" w={"full"}>
          <HStack justify={"space-between"} w="full" alignItems={"flex-start"}>
            <VStack justify={"start"} alignItems={"flex-start"} spacing={0}>
              <Heading size="md">Balance</Heading>
              <Text fontSize={"xs"}>Tokens will be migrated 1:1 from testnet to mainnet</Text>
            </VStack>

            <Flex>{isLoading ? <Spinner size="sm" /> : <SwapButton />}</Flex>
          </HStack>

          <Show below="sm">
            {" "}
            <VStack w={"full"} spacing={6} color={"black"}>
              {balances}
            </VStack>
          </Show>
          <Show above="sm">
            {" "}
            <HStack w={"full"} spacing={6} color={"black"}>
              {balances}
            </HStack>
          </Show>
        </VStack>
      </CardBody>
    </Card>
  )
}
