import { Flex, Heading, Text, Box, Stack, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { WalletIcon } from "./Icons/WalletIcon"
import { VeBetterIcon } from "./Icons/VeBetterIcon"
import { useWalletModal } from "@vechain/vechain-kit"

export const WalletNotConnectedOverlay = () => {
  const { t } = useTranslation()
  const { open } = useWalletModal()
  return (
    <Flex
      borderRadius={"lg"}
      bg="#004CFC"
      w={"100%"}
      align="center"
      justify="center"
      data-testid="wallet-not-connected-overlay"
      p={6}
      overflow={"hidden"}
      position={"relative"}
      bgImage={"url('/images/cloud-background.png')"}
      bgSize={"cover"}
      bgPosition={"center"}
      bgRepeat={"no-repeat"}>
      <Stack
        gap={6}
        direction={["column", "column", "row"]}
        align={"center"}
        justify={["center", "center", "space-between"]}
        w="full">
        <Stack gap={6} direction={["column", "column", "row"]} align={"center"}>
          <WalletIcon />
          <Box maxW={["full", "full", "350px"]}>
            <Heading fontSize={["xl", "xl", "2xl"]} textAlign={["center", "center", "left"]} color="white">
              {t("Wallet not connected")}
            </Heading>
            <Text mt={2} textAlign={["center", "center", "left"]} fontSize="md" fontWeight={"400"} color="white">
              {t("Connect your wallet to see your balance, earn rewards and mint NFTs.")}
            </Text>
          </Box>
        </Stack>
        <Button
          bg={"#E0E9FE"}
          color="#004CFC"
          leftIcon={<VeBetterIcon size={20} />}
          rounded={"full"}
          _hover={{ bg: "#E0E9FEDD" }}
          onClick={open}>
          {t("Connect Wallet")}
        </Button>
      </Stack>
    </Flex>
  )
}
