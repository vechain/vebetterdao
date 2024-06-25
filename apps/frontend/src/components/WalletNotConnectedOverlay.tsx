import { Flex, VStack, Heading, Image, Text, Box } from "@chakra-ui/react"
import { TwoFingersIcon } from "./Icons"
import { ConnectWalletButton } from "./ConnectWalletButton"

export const WalletNotConnectedOverlay = ({ description = "Connect your wallet" }: { description?: string }) => {
  return (
    <Flex
      borderRadius={"lg"}
      bg="primary.400"
      position={"absolute"}
      h={"100%"}
      w={"100%"}
      align="center"
      justify="center"
      zIndex={3}
      data-testid="wallet-not-connected-overlay">
      <Image
        alt="wallet-not-connected-background-bottom"
        src="/images/not_connected_wallet_bottom_layer.png"
        pos={"absolute"}
        bottom={0}
        borderRadius={"lg"}
        left={0}
        boxSize={"full"}
        w="full"
      />
      <Image
        alt="wallet-not-connected-background-top"
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
            {description}
          </Text>
        </Box>
        <ConnectWalletButton responsiveVariant="desktop" />
      </VStack>
    </Flex>
  )
}
