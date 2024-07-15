import { Box, Card, CardBody, CardProps, useBreakpointValue } from "@chakra-ui/react"

type Props = {
  children: React.ReactNode
  cardProps?: CardProps
  mobileStrategy?: "none" | "fullwidth"
}

/**
 * This component is used to render a card on larger screens and just the children on smaller screens.
 */
export const ResponsiveCard = ({ children, cardProps = {}, mobileStrategy = "none" }: Props) => {
  const shouldRenderInCard = useBreakpointValue({
    base: false,
    sm: false,
    md: true,
    lg: true,
  })

  if (shouldRenderInCard) {
    return (
      <Card variant={"baseWithBorder"} w="full" {...cardProps}>
        <CardBody p={6}>{children}</CardBody>
      </Card>
    )
  }

  if (mobileStrategy === "none") return children

  return (
    <Box w={"100vw"} bg="#FFF" px={4} py={2} ml={"-16px"}>
      {children}
    </Box>
  )
}
