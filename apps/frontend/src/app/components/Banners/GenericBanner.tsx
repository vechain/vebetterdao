import type { ReactNode } from "react"
import { Card, Image, Heading, Text, TextProps } from "@chakra-ui/react"

type BannerType = "info" | "success" | "warning"

const bannerColors: Record<
  BannerType,
  {
    bg: Card.RootProps["bg"]
    color: TextProps["color"]
  }
> = {
  info: {
    bg: "banner.blue",
    color: "status.info.strong",
  },
  success: {
    bg: "banner.green",
    color: "status.positive.strong",
  },
  warning: {
    bg: "banner.yellow",
    color: "status.warning.strong",
  },
}

export const GenericBanner = ({
  variant,
  title,
  description,
  logoSrc,
  cta,
}: {
  variant: BannerType
  title: string
  description: ReactNode
  logoSrc?: string
  cta?: ReactNode
}) => {
  return (
    <Card.Root
      flex={1}
      w="full"
      h="full"
      borderRadius="xl"
      flexDirection={{ base: "column", md: "row" }}
      alignItems={{ base: "flex-start", md: "center" }}
      gap="4"
      overflow="hidden"
      bg={bannerColors[variant].bg}
      px="6"
      py="4">
      <Image hideBelow="md" src={logoSrc} alt="logo" objectFit="cover" w="24" h="24" />
      <Card.Body gap={{ base: "2", md: "0" }}>
        <Card.Title>
          <Text textStyle="sm" color={bannerColors[variant].color}>
            {title}
          </Text>
        </Card.Title>
        <Card.Description display="flex" alignItems="center" gap="1">
          {typeof description === "string" ? (
            <Heading size={{ base: "lg", md: "2xl" }} color="text.default" fontWeight="bold" lineClamp={3}>
              {description}
            </Heading>
          ) : (
            description
          )}
        </Card.Description>
      </Card.Body>
      {cta && <Card.Footer>{cta}</Card.Footer>}
    </Card.Root>
  )
}
