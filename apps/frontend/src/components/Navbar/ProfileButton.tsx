import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { AddressIcon } from "../AddressIcon"
import { useWallet } from "@vechain/dapp-kit-react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { FaChevronRight } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

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
  }, [router])

  return (
    <Box borderWidth={1} borderColor={"#A8A8A8"} w={"full"} borderRadius={9} onClick={onClick}>
      <HStack p={2} spacing={2} w={"full"} justifyContent={"space-between"} px={3.5} py={4}>
        <HStack spacing={3}>
          <Box h={14}>
            <AddressIcon address={account ?? ""} borderRadius={"full"} />
          </Box>
          <VStack spacing={0} align={"flex-start"}>
            <Text fontSize={18} fontWeight={600}>
              {humanAddress(account ?? "", 4, 6)}
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
