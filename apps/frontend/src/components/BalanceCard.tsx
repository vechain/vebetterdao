import { useB3trBalance, useB3trTokenDetails, useVot3Balance, useVot3TokenDetails } from "@/api"
import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatGroup,
  StatHelpText,
  StatLabel,
  StatNumber,
  Stack,
  Box,
  Hide,
  useColorModeValue,
  useToken,
  Button,
  VStack,
  Show,
  Flex,
  CardFooter,
  ModalOverlay,
  DrawerOverlay,
  LinkOverlay,
  Text,
} from "@chakra-ui/react"
import { WalletButton, useWallet } from "@vechain/dapp-kit-react"
import { BalancePieChart } from "./BalancePieChart"
import { useMemo } from "react"
import BigNumber from "bignumber.js"
import { SwapB3trButton } from "./SwapB3trButton"
import { getConfig } from "@repo/config"
import { FaRepeat } from "react-icons/fa6"
import { useTokenColors } from "@/hooks/useTokenColors"

const config = getConfig()

type Props = {}
/**
 * BalanceCard displays the balance of the current account
 * @returns BalanceCard
 */
export const BalanceCard: React.FC<Props> = () => {
  const { account } = useWallet()

  const { data: b3trTokenDetails } = useB3trTokenDetails()
  const { data: vot3TokenDetails } = useVot3TokenDetails()

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
  const { b3trColor, vot3Color } = useTokenColors()

  const { data: vot3ContractB3trBalance } = useB3trBalance(config.vot3ContractAddress)

  const isLoading = b3trBalanceLoading || vot3BalanceLoading

  const percentageOfB3trSupply = useMemo(() => {
    if (!b3trTokenDetails || !b3trBalance) return undefined

    const circulatingSupply = new BigNumber(b3trTokenDetails.circulatingSupply)
    const balance = new BigNumber(b3trBalance.scaled)

    return balance.dividedBy(circulatingSupply).multipliedBy(100).toFixed(2)
  }, [b3trTokenDetails, b3trBalance])

  const percentageOfVot3Supply = useMemo(() => {
    if (!vot3ContractB3trBalance || !vot3Balance) return undefined

    const circulatingSupply = new BigNumber(vot3ContractB3trBalance.scaled)
    const balance = new BigNumber(vot3Balance.scaled)

    return balance.dividedBy(circulatingSupply).multipliedBy(100).toFixed(2)
  }, [vot3TokenDetails, vot3Balance])

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

  if (hasNoBalance)
    return (
      <Stack direction={["column", "column", "row"]} spacing={8} w="full">
        <Alert status="warning" borderRadius={"lg"}>
          <AlertIcon />
          <Box>
            <AlertTitle>You have no balance</AlertTitle>
            <AlertDescription>Mint some tokens to get started.</AlertDescription>
          </Box>
        </Alert>
      </Stack>
    )
  return (
    <Card w="full">
      <CardBody>
        <Show below="sm">
          <VStack>
            <HStack justify={"space-between"} w="full">
              <Heading size="sm">Balance</Heading>
              {isLoading ? <Spinner size="sm" /> : <SwapB3trButton />}
            </HStack>
            <BalancePieChart b3trBalance={b3trBalance} vot3Balance={vot3Balance} />
            <StatGroup flexDirection={"row"} alignItems="center" justifyContent="space-between" w="full">
              <Stat textAlign={"center"}>
                <StatLabel color={b3trColor}>B3TR</StatLabel>
                <StatNumber>{b3trBalance?.formatted || "0"}</StatNumber>
              </Stat>
              <Stat textAlign={"center"}>
                <StatLabel color={vot3Color}>VOT3</StatLabel>
                <StatNumber>{vot3Balance?.formatted || "0"}</StatNumber>
              </Stat>
            </StatGroup>
          </VStack>
        </Show>
        <Show above="sm">
          <HStack spacing={8} w="full" align={"flex-start"}>
            <Heading size="sm">Balance</Heading>
            <Flex flex={1}>
              <BalancePieChart b3trBalance={b3trBalance} vot3Balance={vot3Balance} />
            </Flex>
            <StatGroup flexDirection={"row"} alignItems="center" justifyContent="center" flex={1} alignSelf={"center"}>
              <Stat textAlign={"center"}>
                <StatLabel color={b3trColor}>B3TR</StatLabel>
                <StatNumber>{b3trBalance?.formatted || "0"}</StatNumber>
              </Stat>
              <Stat textAlign={"center"}>
                <StatLabel color={vot3Color}>VOT3</StatLabel>
                <StatNumber>{vot3Balance?.formatted || "0"}</StatNumber>
              </Stat>
            </StatGroup>
            <Flex>{isLoading ? <Spinner size="sm" /> : <SwapB3trButton />}</Flex>
          </HStack>
        </Show>
      </CardBody>
      {!account && (
        <Flex backdropFilter="blur(10px)" position={"absolute"} h={"100%"} w={"100%"} align="center" justify="center">
          <Card w={["90%", "50%", "40%"]} rounded="xl" variant="outline">
            <CardBody>
              <VStack gap={4}>
                <Heading fontSize="xl" textAlign={"center"}>
                  No wallet connected
                </Heading>
                <Text textAlign={"center"} fontSize="lg" fontWeight={"thin"}>
                  Connect your wallet to check your balance
                </Text>
                <WalletButton />
              </VStack>
            </CardBody>
          </Card>
        </Flex>
      )}
    </Card>
  )
}
