import { Box, HStack, Text, VStack, Flex, Button, Image } from "@chakra-ui/react"
import { AddressIcon } from "../AddressIcon"
import { useWallet, useWalletModal, useVechainDomain } from "@vechain/vechain-kit"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { FaChevronRight } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { WalletIcon } from "../Icons/WalletIcon"
import { VeBetterIcon } from "../Icons/VeBetterIcon"

type Props = {
  onMenuClose?: () => void
}

export const ProfileButton: React.FC<Props> = ({ onMenuClose }: Props) => {
  const { account } = useWallet()
  const { data: vnsData } = useVechainDomain(account?.address)
  const domain = vnsData?.domain
  const { t } = useTranslation()
  const { open } = useWalletModal()
  const router = useRouter()

  const onClick = useCallback(() => {
    router.push("/profile")
    onMenuClose?.()
  }, [onMenuClose, router])

  const handleConnectWallet = useCallback(() => {
    open()
    onMenuClose?.()
  }, [open, onMenuClose])

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
          src="/assets/backgrounds/cloud-background.webp"
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
              <Text textStyle="md" fontWeight={"400"}>
                {t("Connect your wallet to see your profile")}
              </Text>
            </VStack>
          </HStack>
          <Button
            bg={"#E0E9FE"}
            color="#004CFC"
            rounded={"full"}
            _hover={{ bg: "#E0E9FEDD" }}
            onClick={handleConnectWallet}>
            <VeBetterIcon size={20} />
            {t("Connect Wallet")}
          </Button>
        </VStack>
      </Flex>
    )

  return (
    <Box borderWidth={1} borderColor={"#A8A8A8"} w={"full"} borderRadius={9} onClick={onClick}>
      <HStack p={2} gap={2} w={"full"} justifyContent={"space-between"} px={3.5} py={4}>
        <HStack w="full">
          <AddressIcon address={account?.address ?? ""} minW={14} minH={14} boxSize={14} rounded="full" />
          <VStack gap={0} align={"flex-start"}>
            <Text textStyle="lg" fontWeight={600}>
              {domain ?? humanAddress(account?.address ?? "", 4, 6)}
            </Text>
            <Text textStyle="xs">{t("View your Better Profile")}</Text>
          </VStack>
        </HStack>
        <FaChevronRight size={16} />
      </HStack>
    </Box>
  )
}
