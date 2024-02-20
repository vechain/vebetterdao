"use client"
import { Box, Container, useColorModeValue, useMediaQuery } from "@chakra-ui/react"

export const Footer: React.FC = () => {
  const bg = useColorModeValue("gray.50", "gray.900")

  return (
    <Box bg={bg} zIndex={10} mt={20} h={"200px"} w={"full"}>
      <Container
        w="full"
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems={"center"}
        maxW="container.xl"></Container>
    </Box>
  )
}
