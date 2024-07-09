import { Card, CardBody, CardProps, useBreakpointValue } from "@chakra-ui/react"

type Props = {
  children: React.ReactNode
  cardProps?: CardProps
}

/**
 * This component is used to render a card on larger screens and just the children on smaller screens.
 */
export const ResponsiveCard = ({ children, cardProps = {} }: Props) => {
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

  return children
}
