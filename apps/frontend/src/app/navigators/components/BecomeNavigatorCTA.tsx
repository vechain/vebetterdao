import { Button, Card, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { LuArrowRight, LuShield } from "react-icons/lu"

export const BecomeNavigatorCTA = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <Card.Root
      variant="outline"
      w="full"
      borderRadius="xl"
      borderStyle="dashed"
      cursor="pointer"
      _hover={{ borderColor: "primary.500", bg: "primary.500/5" }}
      onClick={() => router.push("/navigators/become")}>
      <Card.Body display="flex" justifyContent="center" alignItems="center">
        <VStack gap={3} align="center" textAlign="center" py={4}>
          <LuShield size={32} color="var(--chakra-colors-primary-500)" />
          <Text textStyle="sm" fontWeight="semibold">
            {t("Become a Navigator")}
          </Text>
          <Text textStyle="xs" color="fg.muted">
            {t("Stake B3TR, vote on behalf of citizens, and earn delegation fees.")}
          </Text>
          <Button size="xs" variant="outline" colorPalette="primary" mt={1}>
            {t("Get Started")}
            <LuArrowRight />
          </Button>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
