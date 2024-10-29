import { useEndorsementInfos } from "@/hooks/useEndorsementData"
import { Text, HStack, VStack } from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"
import { AddressIcon } from "@/components/AddressIcon"
import { humanAddress } from "@repo/utils/FormattingUtils"

type EndorsementInfoProps = {
  appId: string
  endorserAddress: string
}

export const EndorsementInfo = ({ appId, endorserAddress }: EndorsementInfoProps) => {
  const endorsementInfos = useEndorsementInfos(appId, endorserAddress)
  const { t } = useTranslation()

  return (
    <HStack
      bg="white"
      p={"12px"}
      borderRadius={"16px"}
      boxShadow="sm"
      w={"full"}
      align-items={"center"}
      justify={"space-between"}>
      <HStack alignItems={"center"} gap={4}>
        <AddressIcon address={endorserAddress} rounded="full" h="28px" w="28px" />
        <VStack align="start" justify={"center"} spacing={0}>
          <Text>{humanAddress(endorsementInfos.endorserAddress, 6, 3)}</Text>
          <Text fontSize="12" fontWeight={400} color="#6A6A6A">
            {t("Endorsing since {{date}}", { date: endorsementInfos.dateOfFirstEndorsement })}
          </Text>
        </VStack>
      </HStack>
      <Text fontSize={"16px"} fontWeight={600}>
        <Trans
          i18nKey="{{value}} pts."
          values={{ value: endorsementInfos.endorserTotalPoint || 0 }}
          components={{
            Text: <Text as="span" />,
          }}
        />
      </Text>
    </HStack>
  )
}
