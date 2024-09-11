import { useUserXNodes } from "@/api"
import { Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"

export const EndorsementPointsBanner = () => {
  const { account } = useWallet()
  const { data: xNodes, isLoading } = useUserXNodes(account ?? undefined)

  return (
    <HStack w="full" p="24px" borderRadius={"24px"} bgGradient={"linear(to-r, #29295C,#4747A5)"}>
      <VStack w="full" spacing={2} align="start">
        <Heading fontSize={"16px"} fontWeight={700} color="white">
          As Xnode holder, you have 9 available points to endorse Apps
        </Heading>
        <Text fontSize={"14px"} fontWeight={400} color="white">
          Help a project to reach 100 points and join the next allocations to get funding.
        </Text>
      </VStack>
    </HStack>
  )
}
