import { Button, Card, CardBody, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { BalanceInfo } from "../BalanceCard"

export const B3TRFaucet = () => {
  const claimB3TR = () => {
    console.log("Claim B3TR")
  }

  const b3trBalance = "0.000000000000000000"

  return (
    <Card w="full" variant="baseWithBorder">
      <CardBody>
        <VStack spacing={4} align="flex-start" w={"full"}>
          <HStack justifyContent={"space-between"} w="full">
            <Heading fontSize="24px">{"Faucet"}</Heading>
          </HStack>

          <VStack spacing={8} w="full" align="flex-start" justify={"stretch"}>
            <Text fontSize={"14px"}>{"You can still claim 3 times today."}</Text>
            <BalanceInfo isB3TR balanceScaled={b3trBalance} />
            <Button w={"full"} variant="primaryAction" onClick={claimB3TR}>
              {"Claim B3TR"}
            </Button>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
