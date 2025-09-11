import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { toaster } from "@/components/ui/toaster"

interface Props {
  data: {
    user: string
    totalRewardAmount: number
  }[]
}

export const TopUsersByRewardsChart: React.FC<Props> = ({ data }) => {
  // Sort data by total rewards in descending order
  const sortedData = [...data].sort((a, b) => b.totalRewardAmount - a.totalRewardAmount)

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Custom tick component for the X-axis labels
  const CustomTick = (props: any) => {
    const { x, y, payload } = props
    const address = payload.value
    const displayAddress = formatAddress(address)

    const handleClick = () => {
      navigator.clipboard
        .writeText(address)
        .then(() => {
          toaster.success({
            title: "Address copied",
            description: address,
            duration: 2000,
            closable: true,
          })
        })
        .catch(_ => {
          toaster.error({
            title: "Failed to copy address",
            duration: 2000,
            closable: true,
          })
        })
    }

    return (
      <text
        x={x}
        y={y}
        textAnchor="end"
        fill="#666"
        transform={`rotate(-45, ${x}, ${y})`}
        style={{ fontSize: 12, cursor: "pointer" }}
        onClick={handleClick}>
        {displayAddress}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
        <XAxis dataKey="user" interval={0} tick={<CustomTick />} />
        <YAxis />
        <Tooltip
          formatter={(value: number, name: string) => [`${value.toFixed(4)}`, name]}
          labelFormatter={(label: string) => `User: ${label}`}
        />
        <Bar dataKey="totalRewardAmount" name="Total Rewards" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  )
}
