import { Avatar, Text, VStack, HStack, AvatarGroup, Card, LinkBox, LinkOverlay, Icon } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa"

import { convertUriToUrl } from "@/utils/uri"

export const GmCard = ({
  title,
  subtitle,
  footer,
  imagesIpfsUri,
  href,
}: {
  title?: string
  subtitle?: string
  imagesIpfsUri?: string[]
  footer?: string
  href?: string
}) => {
  const { t } = useTranslation()
  const plusCount = imagesIpfsUri?.length ? imagesIpfsUri?.length - 2 : 0
  return (
    <LinkBox flex={1}>
      <Card.Root bg="transparency.200" gap="2" p="4">
        <Card.Title asChild>
          <HStack w="full" justifyContent="space-between">
            <Text display="block" textStyle="sm" color="white" fontWeight="semibold">
              {subtitle}
            </Text>
            {imagesIpfsUri && imagesIpfsUri?.length > 1 && (
              <HStack gap={1} textStyle="md" fontWeight="semibold">
                <Text color="white" fontWeight="semibold">
                  {t("See all")}
                </Text>
                <Icon as={FaChevronRight} color="white" boxSize="4" />
              </HStack>
            )}
          </HStack>
        </Card.Title>
        <Card.Body>
          <LinkOverlay asChild>
            <NextLink href={href ?? ""}>
              <HStack alignItems="start">
                <AvatarGroup rounded="lg" shape="square" size="xl" stacking="last-on-top" spaceX={"-1.5rem"}>
                  {imagesIpfsUri?.slice(0, 2)?.map(image => (
                    <Avatar.Root key={image} border="0" rounded="lg">
                      <Avatar.Image rounded="lg" src={convertUriToUrl(image)} />
                    </Avatar.Root>
                  ))}

                  {plusCount > 0 && (
                    <Avatar.Root rounded="lg" border="1px solid #E5EEFF" background="status.info.primary">
                      <Avatar.Fallback color="white" textStyle="xxs">{`+${plusCount}`}</Avatar.Fallback>
                    </Avatar.Root>
                  )}
                </AvatarGroup>

                <VStack flex="1" flexDirection={"column-reverse"} alignItems="start" alignSelf="end" gap="0">
                  <HStack bg="#FFFFFF4A" rounded="lg" px="2" py="1" gap="1">
                    <Text textStyle="xs" color="white" fontWeight="semibold" lineClamp={1}>
                      {footer}
                    </Text>
                  </HStack>

                  {title && (
                    <Text textStyle="md" color="white" fontWeight="bold" lineClamp={1}>
                      {title}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </NextLink>
          </LinkOverlay>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
