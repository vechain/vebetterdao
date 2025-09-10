import type { ReactNode } from "react"
import { Card, Image, Heading, Text, TextProps } from "@chakra-ui/react"
import { useBreakpoints } from "@/hooks"

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

export const GenericBanner2 = ({
  variant,
  title,
  description,
  logoSrc,
  cta,
}: {
  variant: BannerType
  title: string
  description: string
  logoSrc?: string
  cta?: ReactNode
}) => {
  const { isMobile } = useBreakpoints()
  return (
    <Card.Root
      w="full"
      borderRadius="xl"
      flexDirection={{ base: "column", md: "row" }}
      alignItems={{ base: "flex-start", md: "center" }}
      gap="4"
      overflow="hidden"
      bg={bannerColors[variant].bg}
      px="6"
      py="4">
      {!isMobile && <Image src={logoSrc} alt="logo" objectFit="cover" w="24" h="24" />}
      <Card.Body gap={{ base: "2", md: "0" }}>
        <Card.Title>
          <Text textStyle="sm" color={bannerColors[variant].color}>
            {title}
          </Text>
        </Card.Title>
        <Card.Description display="flex" alignItems="center" gap="1">
          <Heading size={{ base: "lg", md: "2xl" }} color="text.default" fontWeight="bold">
            {description}
          </Heading>
        </Card.Description>
      </Card.Body>
      {cta && <Card.Footer>{cta}</Card.Footer>}
    </Card.Root>
  )
}
