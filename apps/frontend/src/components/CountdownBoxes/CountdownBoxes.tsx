import { Card, HStack, Text } from "@chakra-ui/react"

type CountdownUnitProps = {
  value: number
  label: string
  bgColor?: string
}

const CountdownUnit = ({ value, label, bgColor }: CountdownUnitProps) => {
  return (
    <Card.Root w="full" {...(bgColor ? { bg: bgColor } : {})}>
      <Card.Body textAlign="center">
        <Text textStyle="lg">{Math.max(0, value)}</Text>
        <Text textStyle="xs" color="text.subtle" textAlign="center">
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
  bgColor?: string
}

export const CountdownBoxes = ({ days, hours, minutes, bgColor }: CountdownBoxesProps) => {
  return (
    <HStack w="full">
      <CountdownUnit value={days} label="days" bgColor={bgColor} />
      <CountdownUnit value={hours} label="hours" bgColor={bgColor} />
      <CountdownUnit value={minutes} label="minutes" bgColor={bgColor} />
    </HStack>
  )
}
