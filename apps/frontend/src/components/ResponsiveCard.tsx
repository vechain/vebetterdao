import { Box, Card, CardRootProps, useBreakpointValue } from "@chakra-ui/react"

type Props = {
  children: React.ReactNode
  cardProps?: CardRootProps
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
      <Card.Root variant="primary" w="full" {...cardProps}>
        <Card.Body p={6}>{children}</Card.Body>
      </Card.Root>
    )
  }

  if (mobileStrategy === "none") return children

  return (
    <Box w={"100vw"} bg="bg.primary" px={4} py={2} ml={"-16px"}>
      {children}
    </Box>
  )
}
