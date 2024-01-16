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
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { BalancePieChart } from "./BalancePieChart"
import { useMemo } from "react"
import BigNumber from "bignumber.js"
import { SwapB3trButton } from "./SwapB3trButton"
import { RedeemB3trButton } from "./RedeemB3trButton"
import { config } from "@repo/config"

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

  if (!account)
    return (
      <Card w="full">
        <CardHeader>
          <Heading size="sm">Your balance</Heading>
        </CardHeader>
        <CardBody>
          <Alert status="info" borderRadius={"lg"}>
            <AlertIcon />
            Connect your wallet first
          </Alert>
        </CardBody>
      </Card>
    )

  if (b3trBalanceError || vot3BalanceError)
    return (
      <Card w="full">
        <CardHeader>
          <Heading size="sm">Your balance</Heading>
        </CardHeader>
        <CardBody>
          <Alert status="error" borderRadius={"lg"}>
            <AlertIcon />
            <AlertTitle>Error fetching your balances</AlertTitle>
            <AlertDescription>{b3trBalanceError?.message ?? vot3BalanceError?.message}</AlertDescription>
          </Alert>
        </CardBody>
      </Card>
    )

  return (
    <Card w="full">
      <CardHeader>
        <HStack justify={"space-between"} align={"center"} w="full">
          <Heading size="sm">Your balance</Heading>
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <HStack spacing={4}>
              <SwapB3trButton /> <RedeemB3trButton />{" "}
            </HStack>
          )}
        </HStack>
      </CardHeader>
      <CardBody>
        <Stack direction={["column", "column", "row"]} spacing={8} w="full">
          <BalancePieChart b3trBalance={b3trBalance} vot3Balance={vot3Balance} />
          <StatGroup w="full" flexDirection={"column"}>
            <Stat>
              <StatLabel>B3TR</StatLabel>
              <StatNumber>{b3trBalance?.formatted}</StatNumber>
              <StatHelpText>{percentageOfB3trSupply}% of the circulating supply</StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>VOT3</StatLabel>
              <StatNumber>{vot3Balance?.formatted}</StatNumber>
              <StatHelpText>{percentageOfVot3Supply}% of the circulating supply</StatHelpText>
            </Stat>
          </StatGroup>
        </Stack>
      </CardBody>
    </Card>
  )
}
