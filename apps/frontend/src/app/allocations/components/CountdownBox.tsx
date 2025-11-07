"use client"

import { Card, VStack, Square, Icon, Text, Mark } from "@chakra-ui/react"
import { Clock } from "iconoir-react"
import Countdown from "react-countdown"

export const CountdownBox = ({ deadline }: { deadline?: Date }) => (
  <Card.Root
    p="4"
    variant="subtle"
    bgColor="status.warning.subtle"
    display="grid"
    gridTemplateColumns="32px 1fr"
    columnGap="2"
    alignItems="center">
    <Square rounded="md" bgColor="status.warning.subtle" aspectRatio={1} height="32px">
      <Icon as={Clock} boxSize="5" color="status.warning.strong" />
    </Square>
    <VStack flex={1} lineClamp={2} gap="1">
      <Text textStyle="xs">{"Left to vote"}</Text>
      <Countdown
        now={() => Date.now()}
        date={deadline}
        renderer={({ days, hours, minutes }) => (
          <Text textStyle="sm">
            <Mark variant="text" fontWeight="semibold">
              {days}
            </Mark>
            {"d "}
            <Mark variant="text" fontWeight="semibold">
              {hours}
            </Mark>
            {"h "}
            <Mark variant="text" fontWeight="semibold">
              {minutes}
            </Mark>
            {"m "}
          </Text>
        )}
      />
    </VStack>
  </Card.Root>
)
