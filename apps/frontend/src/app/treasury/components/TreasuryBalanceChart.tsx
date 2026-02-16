"use client"
import { Chart, useChart } from "@chakra-ui/charts"
import { Card, Heading, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"

import { useTreasuryBalanceHistory } from "../hooks/useTreasuryBalanceHistory"

export const TreasuryBalanceChart = () => {
  const { t } = useTranslation()
  const { chartData, isLoading } = useTreasuryBalanceHistory()

  const displayData = useMemo(() => {
    if (!chartData.length) return []
    const step = Math.max(1, Math.floor(chartData.length / 50))
    return chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1)
  }, [chartData])

  const chart = useChart({
    data: displayData,
    series: [{ name: "b3tr", color: "purple.solid" }],
  })

  const hasData = displayData.length > 0

  return (
    <Card.Root w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <VStack align="start" gap={0}>
            <Heading size="lg" fontWeight="bold">
              {t("Treasury Balance")}
            </Heading>
            <Text textStyle="sm" color="text.muted">
              {t("B3TR balance over time")}
            </Text>
          </VStack>

          <Skeleton loading={isLoading} minH="300px" rounded="md">
            {hasData ? (
              <Chart.Root maxH="sm" chart={chart}>
                <AreaChart data={displayData}>
                  <CartesianGrid stroke={chart.color("border.muted")} vertical={false} />
                  <XAxis axisLine={false} tickLine={false} dataKey="date" tickFormatter={(value: string) => value} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={chart.formatNumber({ notation: "compact" })}
                  />
                  <Tooltip cursor={false} animationDuration={100} content={<Chart.Tooltip />} />
                  <defs>
                    <Chart.Gradient
                      id="b3tr-gradient"
                      stops={[
                        { offset: "0%", color: "purple.solid", opacity: 0.3 },
                        { offset: "100%", color: "purple.solid", opacity: 0.05 },
                      ]}
                    />
                  </defs>
                  <Area
                    type="monotone"
                    isAnimationActive={false}
                    dataKey="b3tr"
                    fill="url(#b3tr-gradient)"
                    stroke={chart.color("purple.solid")}
                    strokeWidth={2}
                  />
                </AreaChart>
              </Chart.Root>
            ) : (
              <VStack h="300px" justify="center">
                <Text color="text.muted">{t("No balance data available")}</Text>
              </VStack>
            )}
          </Skeleton>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
