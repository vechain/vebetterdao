import { HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

type Props = {
  xAppId: string
  amount: string
  isCurrent?: boolean
}

const compactFormatter = getCompactFormatter()

export const AppAmount = ({ xAppId, amount, isCurrent = false }: Props) => {
  const { data: appMetadata, isLoading: appMetadataLoading } = useXAppMetadata(xAppId)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  return (
    <HStack justify={"space-between"} alignItems={"center"}>
      <HStack spacing={3}>
        <Skeleton isLoaded={!isLogoLoading}>
          <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={8} borderRadius="9px" />
        </Skeleton>
        <Skeleton isLoaded={!appMetadataLoading}>
          <Text fontWeight={"600"} size={"xs"}>
            {appMetadata?.name}
          </Text>
        </Skeleton>
      </HStack>
      <VStack spacing={0} alignItems={"flex-end"}>
        <HStack alignItems={"baseline"} spacing={1}>
          <Text size="md" fontWeight={"600"} lineHeight={"16px"}>
            {compactFormatter.format(Number(amount))}
          </Text>
          <Text fontSize={"2xs"} fontWeight={"700"} lineHeight={"16x"}>
            B3TR
          </Text>
        </HStack>
        <HStack>
          <Text fontSize={"xs"} fontWeight={"400"}>
            {isCurrent ? "to receive" : "received"}
          </Text>
        </HStack>
      </VStack>
    </HStack>
  )
}
