import { TokenBalance, TokenDetails } from "@/api"
import { Card, CardHeader, CardBody, Heading, Text, HStack, Spinner, Skeleton } from "@chakra-ui/react"
import { UseQueryResult } from "@tanstack/react-query"
import { useWallet } from "@vechain/dapp-kit-react"

type Props = {
  balanceQueryResult: UseQueryResult<TokenBalance, Error>
  tokenDetailsQueryResult: UseQueryResult<TokenDetails, Error>
  componentUpperRight?: React.ReactNode
  componentLowerRight?: React.ReactNode
}
/**
 * BalanceCard displays the balance of the current account
 * @param param0  balanceQueryResult: UseQueryResult<string, Error>
 * @param param1 tokenDetailsQueryResult: UseQueryResult<TokenDetails, Error>
 * @param param2 componentUpperRight?: React.ReactNode
 * @param param2 componentLowerRight?: React.ReactNode
 * @returns BalanceCard
 */
export const BalanceCard = ({
  balanceQueryResult: { data: balance, isLoading: balanceLoading, error },
  tokenDetailsQueryResult: { data: tokenDetails, isLoading: tokenDetailsLoading },
  componentUpperRight,
  componentLowerRight,
}: Props) => {
  const { account } = useWallet()

  const isLoading = balanceLoading || tokenDetailsLoading
  const loadingSymbolPlaceholder = tokenDetailsLoading ? "B3TR" : undefined

  if (!account)
    return (
      <Card w="full">
        <CardHeader>
          <Heading size="sm">Your {tokenDetails?.symbol} balance</Heading>
        </CardHeader>
        <CardBody>
          <Heading size="md" color={"lightskyblue"}>
            Connect your wallet first
          </Heading>
        </CardBody>
      </Card>
    )

  if (!balance && !balanceLoading)
    return (
      <Card w="full">
        <CardHeader>
          <Heading size="sm">Your balance</Heading>
        </CardHeader>
        <CardBody>
          <Heading size="md" color="orange">
            Unable to load your balance
          </Heading>
          <Text fontSize="sm">{error?.message}</Text>
        </CardBody>
      </Card>
    )

  return (
    <Card w="full">
      <CardHeader>
        <HStack justify={"space-between"} align={"center"} w="full">
          <Heading size="sm">Your {tokenDetails?.symbol} balance</Heading>
          {isLoading ? <Spinner size="sm" /> : componentUpperRight}
        </HStack>
      </CardHeader>
      <CardBody>
        <HStack justify={"space-between"} align={"center"} w="full">
          <HStack spacing={2}>
            <Heading size="lg">
              <Skeleton isLoaded={!balanceLoading}>{balance?.formatted}</Skeleton>
            </Heading>
            <Skeleton isLoaded={!tokenDetailsLoading}>
              <Text fontSize="sm" as="sub">
                {tokenDetails?.symbol ?? loadingSymbolPlaceholder}
              </Text>
            </Skeleton>
          </HStack>
          {componentLowerRight}
        </HStack>
      </CardBody>
    </Card>
  )
}
