import { Box, Card, CardBody, CardProps, useBreakpointValue } from "@chakra-ui/react"
import { useState, useEffect } from "react"

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

  // State to store the client width
  const [clientWidth, setClientWidth] = useState(document.body.clientWidth)

  // Effect to update the clientWidth state on window resize
  useEffect(() => {
    const updateWidth = () => {
      setClientWidth(document.body.clientWidth)
    }

    // Set initial width
    updateWidth()

    // Add window resize event listener
    window.addEventListener("resize", updateWidth)

    // Clean up listener on component unmount
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

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
