import { Box, HStack, Text, VStack, Flex, Button, Image } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useWallet, useWalletModal, useVechainDomain } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa6"

import { WalletIcon } from "../Icons/WalletIcon"
import { VeBetterIcon } from "../Icons/VeBetterIcon"
import { AddressIcon } from "../AddressIcon"

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
        bg="actions.tertiary.default"
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
              <Text textStyle="md">{t("Connect your wallet to see your profile")}</Text>
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
    <Box w={"full"} onClick={onClick}>
      <HStack w={"full"} justifyContent={"flex-start"} py={4}>
        <AddressIcon address={account?.address ?? ""} minW={14} minH={14} boxSize={14} rounded="full" />
        <VStack align={"flex-start"} gap={2}>
          <HStack>
            <Text textStyle="lg" fontWeight="semibold">
              {domain ?? humanAddress(account?.address ?? "", 4, 6)}
            </Text>
            <FaChevronRight size={16} />
          </HStack>
          <Text textStyle="sm" color="text.subtle">
            {t("View profile")}
          </Text>
        </VStack>
      </HStack>
    </Box>
  )
}
