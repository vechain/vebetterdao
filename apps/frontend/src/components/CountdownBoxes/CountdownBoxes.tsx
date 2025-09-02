import { Card, HStack, Text } from "@chakra-ui/react"

type CountdownUnitProps = {
  value: number
  label: string
}

const CountdownUnit = ({ value, label }: CountdownUnitProps) => {
  return (
    <Card.Root variant="filledSmall" w="full">
      <Card.Body textAlign="center">
        <Text fontSize="lg" fontWeight="bold">
          {Math.max(0, value)}
        </Text>
        <Text fontSize="xs" color="text.subtle" textAlign="center">
          {label}
        </Text>
      </Card.Body>
    </Card.Root>
  )
}

type CountdownBoxesProps = {
  days: number
  hours: number
  minutes: number
}

export const CountdownBoxes = ({ days, hours, minutes }: CountdownBoxesProps) => {
  return (
    <HStack w="full">
      <CountdownUnit value={days} label="days" />
      <CountdownUnit value={hours} label="hours" />
      <CountdownUnit value={minutes} label="minutes" />
    </HStack>
  )
}
