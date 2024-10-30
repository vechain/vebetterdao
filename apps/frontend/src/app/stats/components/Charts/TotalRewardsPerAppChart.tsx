import React from "react"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"

interface Props {
  data: { name: string; appId: string; rewards: number }[]
}

export const TotalRewardsPerAppChart: React.FC<Props> = ({ data }) => {
  // Sort the data by rewards in descending order
  const sortedData = [...data].sort((a, b) => b.rewards - a.rewards)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
        <XAxis
          dataKey="name"
          interval={0} // Ensures every label is displayed
          // @ts-ignore
          tick={{ fontSize: 12, angle: -45, textAnchor: "end" }} // Rotates labels to prevent truncation
        />
        <Tooltip formatter={(value: number) => [`${value.toFixed(2)}`, "Rewards"]} />
        <Bar dataKey="rewards" name="Total Rewards" fill="#ffc658">
          <LabelList dataKey="rewards" position="top" formatter={(value: number) => value.toFixed(2)} />
          {sortedData.map((_, index) => (
            <Cell key={`cell-${index}`} fill="#ffc658" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
