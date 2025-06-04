import { HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { t } from "i18next"
import { B3TRIcon } from "@/components/Icons"
import { useXAppMetadata } from "@/api/contracts/xApps"

type Props = {
  xAppId?: string
  amount?: string | number
  isLoading?: boolean
}

const compactFormatter = getCompactFormatter()

export const AppAmount = ({ xAppId, amount, isLoading }: Props) => {
  const { data: appMetadata, isLoading: appMetadataLoading } = useXAppMetadata(xAppId)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  return (
    <HStack justify={"space-between"} alignItems={"center"}>
      <HStack spacing={3}>
        <Skeleton isLoaded={!isLogoLoading && !isLoading}>
          <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={"32px"} borderRadius="9px" />
        </Skeleton>
        <Skeleton isLoaded={!appMetadataLoading && !isLoading}>
          <Text fontWeight={"600"} fontSize={"16px"}>
            {appMetadata?.name}
          </Text>
        </Skeleton>
      </HStack>
      <VStack spacing={0} alignItems={"flex-end"}>
        <Skeleton isLoaded={!isLoading}>
          <HStack alignItems={"center"} spacing={1}>
            <Text fontSize="20px" fontWeight={700}>
              {compactFormatter.format(Number(amount))}
            </Text>
            <B3TRIcon boxSize={"20px"} colorVariant="dark" />
          </HStack>
        </Skeleton>
        <Text fontSize={"12px"} fontWeight={400} color="#6A6A6A">
          {t("received")}
        </Text>
      </VStack>
    </HStack>
  )
}
