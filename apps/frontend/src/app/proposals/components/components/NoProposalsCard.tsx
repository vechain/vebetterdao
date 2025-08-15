import { Box, VStack, Image, Text, Button } from "@chakra-ui/react"
import React from "react"
import { useTranslation } from "react-i18next"

type Props = {
  buttonText: string
  onClick: () => void
  description?: React.ReactNode
}
export const NoProposalsCard = ({ buttonText, onClick, description }: Props) => {
  const { t } = useTranslation()

  return (
    <Box
      bg={"contrast-on-dark-bg"}
      borderRadius={12}
      py={{ base: 5, md: 16 }}
      px={{ base: 5, md: 14 }}
      w={"full"}
      position={"relative"}
      overflow={"clip"}>
      <Image
        src="/assets/backgrounds/blue-cloud-bg-card.webp"
        position={"absolute"}
        alt="blue-cloud-bg"
        right={{ base: -140, md: 0 }}
        top={{ base: -115, md: -20 }}
        boxSize={{ base: "400px", md: "600px" }}
        zIndex={0}
      />
      <VStack w={{ base: "100%", md: "60%" }} alignContent={"flex-start"} zIndex={2} position={"relative"}>
        <Text fontSize={24} fontWeight={700} alignSelf={"flex-start"}>
          {t("No Proposals Found")}
        </Text>
        {description}
        <Button onClick={onClick} variant={"primaryAction"} alignSelf={"flex-start"} mt={4} mb={2}>
          {buttonText}
        </Button>
      </VStack>
    </Box>
  )
}
