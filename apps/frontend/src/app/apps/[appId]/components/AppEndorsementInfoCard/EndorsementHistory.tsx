import { useEndorsementHistory, AppEndorsedHistoryEvent } from "@/hooks/useEndorsementData"
import { Text, HStack, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type EndorsementHistoryProps = {
  event: AppEndorsedHistoryEvent
}

export const EndorsementHistory = ({ event }: EndorsementHistoryProps) => {
  const { t } = useTranslation()
  const endorsementHistory = useEndorsementHistory(event)

  const truncateAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  return (
    <HStack
      p={2}
      borderRadius={"16px"}
      borderBottom={"1px solid #EFEFEF"}
      w={"full"}
      alignItems={"center"}
      justify={"space-between"}>
      <VStack align="start" justifyContent={"flex-start"} spacing={0}>
        <Text>{truncateAddress(endorsementHistory.endorserAddress)}</Text>
        <Text fontSize="xs" color="#6A6A6A">
          {t("{{date}}", {
            date: endorsementHistory.dateOfEndorsement,
          })}
        </Text>
      </VStack>
      <VStack align="end" spacing={0}>
        <Text fontWeight={600} color={endorsementHistory.isUnendorsing ? "#C84968" : "#3DBA67"}>
          {`${endorsementHistory.isUnendorsing ? "-" : "+"}${t("{{value}} pts.", { value: endorsementHistory.endorserPoint })}`}
        </Text>
        <Text fontSize="xs" color="#6A6A6A">
          {t("{{value}} pts in total.", { value: endorsementHistory.endorserTotalPoint })}
        </Text>
      </VStack>
    </HStack>
  )
}
