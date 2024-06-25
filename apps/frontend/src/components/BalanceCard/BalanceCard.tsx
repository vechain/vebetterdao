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
  Container,
  Box,
  Image,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { B3TRIcon, VOT3Icon } from "../Icons"
import { ConvertButton } from "../Convert/ConvertButton"
import { useTokenColors } from "@/hooks"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { BalanceInfo } from "./components"

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(4)

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
      <BalanceInfo isB3TR={true} balanceScaled={b3trBalanceScaled} />
      <BalanceInfo isB3TR={false} balanceScaled={vot3BalanceScaled} />
    </VStack>
  )

  return (
    <Card w="full" variant="baseWithBorder">
      <CardBody>
        <VStack spacing={4} align="flex-start" w={"full"}>
          <Box w={"full"} color={"black"} flexDirection={{ base: "column", md: "row" }}>
            {balances}
          </Box>

          <HStack justify={"space-between"} w="full" mt={4}>
            <Flex w={"full"}>{isLoading ? <Spinner size="sm" /> : <ConvertButton />}</Flex>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
