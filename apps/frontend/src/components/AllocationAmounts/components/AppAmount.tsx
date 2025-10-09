import { Card, Flex, HStack, Image, LinkBox, LinkOverlay, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { t } from "i18next"
import NextLink from "next/link"

import { B3TRIcon } from "../../Icons/B3TRIcon"
import { useIpfsImage } from "../../../api/ipfs/hooks/useIpfsImage"
import { useXAppMetadata } from "../../../api/contracts/xApps/hooks/useXAppMetadata"

import { notFoundImage } from "@/constants"

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
    <LinkBox flex={1}>
      <LinkOverlay asChild>
        <NextLink href={`/apps/${xAppId}`}>
          <Card.Root variant="subtle" p="4">
            <Card.Body>
              <Flex gap={3} alignItems="center">
                <Skeleton loading={isLogoLoading || isLoading}>
                  <Image
                    src={logo?.image ?? notFoundImage}
                    alt={appMetadata?.name}
                    boxSize={"32px"}
                    borderRadius="9px"
                  />
                </Skeleton>
                <Skeleton flex={1} loading={appMetadataLoading || isLoading}>
                  <Text flex={1} fontWeight="semibold" textStyle="md" lineClamp={1}>
                    {appMetadata?.name}
                  </Text>
                </Skeleton>
                <VStack gap={0} alignItems={"flex-end"}>
                  <Skeleton loading={isLoading}>
                    <HStack alignItems={"center"} gap={1}>
                      <Text textStyle="lg" fontWeight="bold">
                        {compactFormatter.format(Number(amount))}
                      </Text>
                      <B3TRIcon boxSize={"20px"} colorVariant="dark" />
                    </HStack>
                  </Skeleton>

                  <Text textStyle={"xs"} color="text.subtle">
                    {t("received")}
                  </Text>
                </VStack>
              </Flex>
            </Card.Body>
          </Card.Root>
        </NextLink>
      </LinkOverlay>
    </LinkBox>
  )
}
