import { Card, Flex, HStack, Image, Link, LinkBox, LinkOverlay, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { t } from "i18next"
import { B3TRIcon } from "@/components/Icons"
import { useXAppMetadata } from "@/api"

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
      <LinkOverlay>
        <Card.Root variant="outline" bg="bg.primary" borderColor="border.secondary">
          <Card.Body px={4} py={3}>
            <Flex gap={3} alignItems="center">
              <Skeleton loading={isLogoLoading || isLoading}>
                <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={"32px"} borderRadius="9px" />
              </Skeleton>
              <Skeleton flex={1} loading={appMetadataLoading || isLoading}>
                <Link asChild href={`/apps/${xAppId}`}>
                  <Text flex={1} fontWeight="semibold" textStyle="md" lineClamp={1}>
                    {appMetadata?.name}
                  </Text>
                </Link>
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
      </LinkOverlay>
    </LinkBox>
  )
}
