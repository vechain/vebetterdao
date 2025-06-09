import { Button, Icon, Image, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { PiSquaresFourFill } from "react-icons/pi"

export const NoActionsCard = () => {
  const { t } = useTranslation()
  const router = useRouter()
  return (
    <VStack spacing={4} bg="info-bg" align="center" w="full" borderRadius="md" py="16px" px="28px">
      <Image src="/assets/icons/hand-plant.svg" boxSize={"78px"} color="#757575" alt="No proposals" />
      <Text fontSize={"16px"} fontWeight={500} color={"#757575"} textAlign="center">
        {t("Use the Apps to do some Better Actions and earn tokens!")}
      </Text>
      <Button
        rounded={"full"}
        variant={"outline"}
        colorScheme="primary"
        leftIcon={<Icon as={PiSquaresFourFill} />}
        onClick={() => router.push("/apps")}>
        {t("Explore Apps")}
      </Button>
    </VStack>
  )
}
