import { Box, Button, Circle, Heading, HStack, Image, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaArrowRight } from "react-icons/fa6"

type Props = {
  totalRewardsLabel: string
  weekDays: { label: string; isToday: boolean }[]
  onCtaClick: () => void
}

export const LastSevenDaysInactive = ({ totalRewardsLabel, weekDays, onCtaClick }: Props) => {
  const { t } = useTranslation()

  return (
    <VStack gap={3} align="center" textAlign="center" py={2}>
      <Box position="relative" w="110px" h="110px">
        <Box
          position="absolute"
          inset="-8px"
          borderRadius="full"
          bg="radial-gradient(circle at center, var(--vbd-colors-brand-secondary-subtle) 0%, transparent 65%)"
          opacity={0.7}
        />
        <Image
          position="relative"
          src="/assets/mascot/b3mo-referee.png"
          alt="B3MO"
          boxSize="110px"
          objectFit="contain"
        />
      </Box>

      <HStack gap={2} color="text.subtle">
        <Box w="6px" h="6px" borderRadius="full" bg="red.500" boxShadow="0 0 0 3px rgba(229,62,62,0.18)" />
        <Text textStyle="xs">{t("No actions in the last 7 days")}</Text>
      </HStack>

      <VStack gap={2} maxW="290px">
        <Heading size="md" fontWeight="bold">
          {t("B3MO misses you")}
        </Heading>
        <Text textStyle="sm" color="text.subtle">
          {t(
            "You've earned {{amount}} B3TR so far — don't let your momentum fade. One quick action gets you back on the board.",
            { amount: totalRewardsLabel },
          )}
        </Text>
      </VStack>

      <Button rounded="full" variant="primary" onClick={onCtaClick}>
        {t("Do an action now")}
        <FaArrowRight />
      </Button>

      <SimpleGrid w="full" columns={7} gap={2} mt={2} pt={4} borderTopWidth="1px" borderColor="borders.secondary">
        {weekDays.map(day => (
          <VStack key={day.label} gap={1}>
            <Circle
              size="28px"
              borderWidth={day.isToday ? "2px" : "1px"}
              borderStyle={day.isToday ? "solid" : "dashed"}
              borderColor={day.isToday ? "brand.secondary-strong" : "borders.secondary"}
              bg={day.isToday ? "bg.primary" : "bg.tertiary"}
              boxShadow={day.isToday ? "0 0 0 3px var(--vbd-colors-brand-secondary-subtle)" : undefined}
            />
            <Text
              textStyle="2xs"
              color={day.isToday ? "text.default" : "text.subtle"}
              fontWeight={day.isToday ? "semibold" : "normal"}>
              {day.label}
            </Text>
          </VStack>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
