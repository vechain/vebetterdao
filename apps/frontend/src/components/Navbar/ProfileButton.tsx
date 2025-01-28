import { Box, HStack, Text, VStack, Flex, Image } from "@chakra-ui/react"
import { AddressIcon } from "../AddressIcon"
import { useWallet } from "@vechain/vechain-kit"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { FaChevronRight } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { WalletIcon } from "../Icons/WalletIcon"
import { ConnectWalletButton } from "../ConnectWalletButton"

type Props = {
  onMenuClose?: () => void
}

export const ProfileButton: React.FC<Props> = ({ onMenuClose }: Props) => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const router = useRouter()

  const onClick = useCallback(() => {
    router.push("/profile")
    onMenuClose?.()
  }, [onMenuClose, router])

  if (!account?.address)
    return (
      <Flex
        borderRadius={"lg"}
        bg="#004CFC"
        w={"100%"}
        align="center"
        justify="center"
        zIndex={3}
        data-testid="wallet-not-connected-overlay"
        p={6}
        overflow={"hidden"}
        position={"relative"}>
        <Image
          src="/images/cloud-background.png"
          alt="cloud-background"
          position="absolute"
          w={"150%"}
          maxW={"150%"}
          top={"-50%"}
        />
        <VStack zIndex={2} align={"stretch"} w="full" gap={4}>
          <HStack gap={4} zIndex={2}>
            <Flex justify={"center"} align={"center"} h={14} w={14}>
              <WalletIcon size={"3.5rem"} />
            </Flex>
            <VStack align="stretch" color="white">
              <Text fontSize="md" fontWeight={"400"}>
                {t("Connect your wallet to see your profile")}
              </Text>
            </VStack>
          </HStack>
          <ConnectWalletButton />
        </VStack>
      </Flex>
    )

  return (
    <Box borderWidth={1} borderColor={"#A8A8A8"} w={"full"} borderRadius={9} onClick={onClick}>
      <HStack p={2} spacing={2} w={"full"} justifyContent={"space-between"} px={3.5} py={4}>
        <HStack spacing={3}>
          <Box h={14}>
            <AddressIcon address={account?.address ?? ""} borderRadius={"full"} />
          </Box>
          <VStack spacing={0} align={"flex-start"}>
            <Text fontSize={18} fontWeight={600}>
              {humanAddress(account?.address ?? "", 4, 6)}
            </Text>
            <Text fontSize={12} fontWeight={400}>
              {t("View your Better Profile")}
            </Text>
          </VStack>
        </HStack>
        <FaChevronRight size={16} />
      </HStack>
    </Box>
  )
}
