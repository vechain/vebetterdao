import React, { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Button, VStack } from "@chakra-ui/react"
import { toaster } from "@/components/ui/toaster"

interface Props {
  data: {
    user: string
    totalRewardAmount: number
  }[]
}

interface AggregatedData {
  key: string
  totalRewardAmount: number
  children?: AggregatedData[]
}

const levels = [250, 50, 10, 1] // Levels of aggregation

export const DrillDownBarChart: React.FC<Props> = ({ data }) => {
  // State to keep track of drill-down levels
  const [currentLevelData, setCurrentLevelData] = useState<AggregatedData[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([])

  // Function to aggregate data
  const aggregateData = (data: Props["data"], groupSize: number): AggregatedData[] => {
    const sortedData = [...data].sort((a, b) => b.totalRewardAmount - a.totalRewardAmount)
    const aggregated: AggregatedData[] = []

    for (let i = 0; i < sortedData.length; i += groupSize) {
      const group = sortedData.slice(i, i + groupSize)
      const totalRewardAmount = group.reduce((sum, item) => sum + item.totalRewardAmount, 0)

      if (groupSize === 1) {
        // At the lowest level, use the user's address as the key
        aggregated.push({
          key: group[0]?.user ?? "",
          totalRewardAmount: group[0]?.totalRewardAmount ?? 0,
          children: undefined,
        })
      } else {
        aggregated.push({
          key: `Accounts ${i + 1}-${i + group.length}`,
          totalRewardAmount,
          children: group.map(item => ({
            key: item.user,
            totalRewardAmount: item.totalRewardAmount,
          })),
        })
      }
    }

    return aggregated
  }

  // Initialize data aggregation
  React.useMemo(() => {
    const aggregated = aggregateData(data, levels[0] ?? 1)
    setCurrentLevelData(aggregated)
    setBreadcrumbs([])
  }, [data])

  // Handle bar click to drill down
  const handleBarClick = (data: AggregatedData) => {
    const currentLevelIndex = breadcrumbs.length
    if (currentLevelIndex + 1 < levels.length) {
      const nextGroupSize = levels[currentLevelIndex + 1] ?? 1
      const aggregated = data.children
        ? aggregateData(
            data.children.map(child => ({
              user: child.key,
              totalRewardAmount: child.totalRewardAmount,
            })),
            nextGroupSize,
          )
        : []
      setCurrentLevelData(aggregated)
      setBreadcrumbs([...breadcrumbs, data.key])
    } else {
      // Already at the lowest level (individual users)
      toaster.info({
        title: "Reached the lowest level",
        description: "You are viewing individual users.",
        duration: 2000,
        closable: true,
      })
    }
  }

  // Handle drill up
  const handleDrillUp = () => {
    const newBreadcrumbs = breadcrumbs.slice(0, -1)
    setBreadcrumbs(newBreadcrumbs)

    const currentLevelIndex = newBreadcrumbs.length
    const currentGroupSize = levels[currentLevelIndex] ?? 1

    // Reconstruct the data for the current level
    let dataToAggregate = data

    // Traverse down the breadcrumbs to get the data to aggregate
    for (let i = 0; i < newBreadcrumbs.length; i++) {
      const breadcrumb = newBreadcrumbs[i]
      const aggregated = aggregateData(dataToAggregate, levels[i] ?? 1)
      const matchingGroup = aggregated.find(item => item.key === breadcrumb)
      dataToAggregate =
        matchingGroup?.children?.map(child => ({
          user: child.key,
          totalRewardAmount: child.totalRewardAmount,
        })) || []
    }

    // Aggregate data at current level
    const aggregatedData = aggregateData(dataToAggregate, currentGroupSize)
    setCurrentLevelData(aggregatedData)
  }

  const currentLevelIndex = breadcrumbs.length
  const isAtLowestLevel = currentLevelIndex === levels.length - 1

  // Custom tick component for the X-axis labels
  const CustomTick = (props: any) => {
    const { x, y, payload } = props
    const label = payload.value

    const handleCopy = () => {
      navigator.clipboard
        .writeText(label)
        .then(() => {
          toaster.success({
            title: "Address Copied",
            description: "The account address has been copied to your clipboard.",
            duration: 2000,
            closable: true,
          })
        })
        .catch(err => {
          console.error("Could not copy text: ", err)
        })
    }

    return (
      <text
        x={x}
        y={y}
        textAnchor="end"
        fill="#666"
        transform={`rotate(-45, ${x}, ${y})`}
        style={{ fontSize: 12, cursor: isAtLowestLevel ? "pointer" : "default" }}
        onClick={isAtLowestLevel ? handleCopy : undefined}>
        {label}
      </text>
    )
  }

  return (
    <VStack width="100%">
      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <Button onClick={handleDrillUp} alignSelf="flex-start" size="sm">
          {`Back to ${breadcrumbs[breadcrumbs.length - 1]}`}
        </Button>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={currentLevelData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          onClick={(event: any) => {
            if (event && event.activePayload) {
              const payload = event.activePayload[0].payload
              handleBarClick(payload)
            }
          }}>
          <XAxis dataKey="key" interval={0} tick={props => <CustomTick {...props} />} />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toFixed(4)}`, name]}
            labelFormatter={(label: string) => `${label}`}
          />
          <Bar dataKey="totalRewardAmount" name="Total Rewards" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </VStack>
  )
}
