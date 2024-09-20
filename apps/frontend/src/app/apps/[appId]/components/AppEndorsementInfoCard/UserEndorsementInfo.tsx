import { useEndorsementInfos, /*useEndorsementHistory*/ } from "@/hooks/useEndorsementData"
import { Text, HStack, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { AddressIcon } from "@/components/AddressIcon"

interface UserEndorsementInfoProps {
  appId: string
  address: string
}

export const UserEndorsementInfo = ({ appId, address }: UserEndorsementInfoProps) => {
  const endorsementInfos = useEndorsementInfos(appId, address)
  const { t } = useTranslation()

  const truncateAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <HStack
      bg="white"
      p={2}
      borderRadius={"16px"}
      boxShadow="sm"
      w={"full"}
      align-items={"center"}
      justify={"space-between"}>
      <HStack alignItems={"center"} gap={4}>
        <AddressIcon address={address} rounded="full" h="28px" w="28px" />
        <VStack align="start" justify={"center"} spacing={0}>
          <Text>{truncateAddress(endorsementInfos.endorserAddress)}</Text>
          <Text fontSize="xs" color="#6A6A6A">
            {t("Endorsing since {{date}}",{value: endorsementInfos.dateOfFirstEndorsement})}
          </Text>
        </VStack>
      </HStack>
      <Text>{t("{{value}} pts.", { value: endorsementInfos.endorserTotalPoint })}</Text>
    </HStack>
  )
}
