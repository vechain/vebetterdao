import { useEndorsementHistory } from "@/hooks/useEndorsementData"
import { AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { Text, HStack, VStack } from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"

type Props = {
  event: AppEndorsedEvent
}

export const EndorsementHistory = ({ event }: Props) => {
  const { t } = useTranslation()
  const endorsementHistory = useEndorsementHistory(event)

  return (
    <HStack
      p={2}
      borderRadius={"16px"}
      borderBottom={"1px solid #EFEFEF"}
      w={"full"}
      alignItems={"center"}
      justify={"space-between"}>
      <VStack align="start" justifyContent={"flex-start"} spacing={0} flex={1}>
        <Text>{humanAddress(endorsementHistory.endorserAddress, 6, 3)}</Text>
        <Text fontSize="xs" color="#6A6A6A">
          {t("{{date}}", {
            date: endorsementHistory.dateOfEndorsement,
          })}
        </Text>
      </VStack>
      <VStack align="end" spacing={0} flex={1} w="full">
        <HStack spacing={1} align="flex-start">
          <Text fontWeight={600} color={endorsementHistory.endorsed ? "#3DBA67" : "#C84968"}>
            {`${endorsementHistory.endorsed ? "+" : "-"}`}
          </Text>

          <Text fontWeight={600} color={endorsementHistory.endorsed ? "#3DBA67" : "#C84968"}>
            <Trans
              i18nKey="{{value}} pts."
              values={{ value: endorsementHistory.endorserPoint || 0 }}
              components={{
                Text: <Text as="span" fontWeight={600} color={endorsementHistory.endorsed ? "#3DBA67" : "#C84968"} />,
              }}
            />
          </Text>
        </HStack>

        <Text fontSize="xs" color="#6A6A6A">
          {t("{{value}} pts in total.", { value: endorsementHistory.endorserTotalPoint })}
        </Text>
      </VStack>
    </HStack>
  )
}
