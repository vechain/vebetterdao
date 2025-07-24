import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { FormattingUtils } from "@repo/utils"
import { toaster } from "@/components/ui/toaster"

interface Props {
  data: { user: string; totalActions: number }[]
}

export const TopUsersChart: React.FC<Props> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={data}>
        <XAxis dataKey="user" tick={<CustomizedAxisTick />} interval={0} height={100} />
        <YAxis label={{ value: "Actions", angle: -90, position: "insideLeft", dx: -10 }} />
        <Tooltip
          formatter={(value: number) => [value, "Actions"]}
          labelFormatter={(label: string) => `User: ${label}`}
        />
        <Legend />
        <Bar dataKey="totalActions" name="Actions" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Custom Tick Component
const CustomizedAxisTick = (props: any) => {
  const { x, y, payload } = props

  // Abbreviate the address
  const displayAddress = FormattingUtils.humanAddress(payload.value, 6, 8)

  // Click handler to copy full address
  const handleClick = () => {
    navigator.clipboard.writeText(payload.value)
    toaster.success({
      title: "Address copied",
      description: `Copied ${payload.value} to clipboard.`,
      duration: 3000,
      closable: true,
    })
  }

  return (
    <g transform={`translate(${x},${y})`} onClick={handleClick} style={{ cursor: "pointer" }}>
      <text x={0} y={0} dy={16} textAnchor="end" transform="rotate(-90)" fill="#666" fontSize={12}>
        {displayAddress}
      </text>
    </g>
  )
}
