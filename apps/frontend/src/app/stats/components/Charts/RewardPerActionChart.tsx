import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts"

interface Props {
  data: {
    name: string
    appId: string
    averageRewardPerAction: number
    medianRewardPerAction: number
  }[]
}

export const RewardPerActionChart: React.FC<Props> = ({ data }) => {
  // Sort the data by average reward in descending order
  const sortedData = [...data].sort((a, b) => b.averageRewardPerAction - a.averageRewardPerAction)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
        <XAxis
          dataKey="name"
          interval={0}
          // @ts-ignore
          tick={{ fontSize: 12, angle: -45, textAnchor: "end" }}
        />
        <YAxis />
        <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(4)}`, name]} />
        <Legend />
        <Bar dataKey="averageRewardPerAction" name="Average Reward per Action" fill="#8884d8">
          <LabelList dataKey="averageRewardPerAction" position="top" formatter={(value: number) => value.toFixed(4)} />
        </Bar>
        <Bar dataKey="medianRewardPerAction" name="Median Reward per Action" fill="#82ca9d">
          <LabelList dataKey="medianRewardPerAction" position="top" formatter={(value: number) => value.toFixed(4)} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
