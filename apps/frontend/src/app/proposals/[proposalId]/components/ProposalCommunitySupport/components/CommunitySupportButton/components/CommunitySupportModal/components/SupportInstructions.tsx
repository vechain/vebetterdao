import { Handshake } from "@/components"
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const SupportInstructions = ({ goToNextStep }: { goToNextStep: () => void }) => {
  const { t } = useTranslation()

  return (
    <VStack gap={6} alignItems={"stretch"}>
      <Text fontSize={"36px"} fontWeight={700}>
        {t("What is community support?")}
      </Text>
      <HStack gap={6}>
        <Box>
          <Handshake size={124} />
        </Box>
        <Text>
          {t(
            "For a proposal to make it to a public vote, it must achieve community support. You can collaborate with this proposal by temporarily contributing some VOT3 tokens.",
          )}
        </Text>
      </HStack>
      <Text fontWeight={600} fontSize={"16px"}>
        {t("You will be able to get those tokens back when the round is over.")}
      </Text>
      <Button onClick={goToNextStep} w="full" variant="primaryAction">
        {t("Continue")}
      </Button>
    </VStack>
  )
}
