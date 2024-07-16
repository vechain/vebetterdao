import { Button, Card, CardBody, HStack, Heading, Skeleton, Text, VStack } from "@chakra-ui/react"
import { BalanceInfo } from "../BalanceCard"
import { useB3trBalance, useRemainingClaims } from "@/api"
import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/dapp-kit-react"

export const B3TRFaucet = () => {
  const { account } = useWallet()
  const claimB3TR = () => {
    console.log("Claim B3TR")
  }

  const { data: b3trBalance } = useB3trBalance(getConfig().b3trFaucetAddress)
  const { data: remainingClaims } = useRemainingClaims(account ?? "")

  return (
    <Card w="full" variant="baseWithBorder">
      <CardBody>
        <VStack spacing={4} align="flex-start" w={"full"}>
          <HStack justifyContent={"space-between"} w="full">
            <Heading fontSize="24px">{"Faucet"}</Heading>
          </HStack>

          <VStack spacing={8} w="full" align="flex-start" justify={"stretch"}>
            <Skeleton isLoaded={!!remainingClaims}>
              <Text fontSize={"14px"}>{`You can still claim ${remainingClaims} times today.`}</Text>
            </Skeleton>
            <BalanceInfo isB3TR balanceScaled={b3trBalance?.scaled ?? ""} />
            <Button w={"full"} variant="primaryAction" onClick={claimB3TR}>
              {"Claim B3TR"}
            </Button>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
