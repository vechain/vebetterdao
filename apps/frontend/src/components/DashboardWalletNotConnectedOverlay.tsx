import { Flex, VStack, Heading, Image, Text, Box } from "@chakra-ui/react"
import { WalletButton } from "@vechain/dapp-kit-react"
import { TwoFingersIcon } from "./Icons"

export const DashboardWalletNotConnectedOverlay = () => {
  return (
    <Flex
      borderRadius={"lg"}
      bg="primary.400"
      position={"absolute"}
      h={"100%"}
      w={"100%"}
      align="center"
      justify="center"
      zIndex={1}>
      <Image
        src="/images/not_connected_wallet_bottom_layer.png"
        pos={"absolute"}
        bottom={0}
        borderRadius={"lg"}
        left={0}
        boxSize={"full"}
        w="full"
      />
      <Image
        src="/images/not_connected_wallet_top_layer.png"
        pos={"absolute"}
        top={0}
        borderRadius={"lg"}
        right={0}
        h="50%"
      />
      <VStack gap={6} zIndex={2}>
        <TwoFingersIcon boxSize={20} />
        <Box>
          <Heading fontSize="xl" textAlign={"center"} color="white">
            Wallet not connected
          </Heading>
          <Text mt={2} textAlign={"center"} fontSize="md" fontWeight={"400"} color="white">
            Connect your wallet to check your balance
          </Text>
        </Box>
        <WalletButton />
      </VStack>
    </Flex>
  )
}
