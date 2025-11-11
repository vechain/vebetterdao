"use client"

import { Text, Mark } from "@chakra-ui/react"
import { Clock } from "iconoir-react"
import Countdown from "react-countdown"

import { StatCard } from "./StatCard"

export const CountdownBox = ({ deadline }: { deadline?: Date }) => (
  <StatCard
    variant="warning"
    icon={<Clock />}
    title={"Left to vote"}
    subtitle={
      <Countdown
        now={() => Date.now()}
        date={deadline}
        renderer={({ days, hours, minutes }) => (
          <Text textStyle={{ base: "sm", md: "2xl" }}>
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
    }
  />
)
