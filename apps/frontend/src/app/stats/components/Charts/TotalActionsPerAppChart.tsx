import React from "react"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"

interface Props {
  data: { name: string; appId: string; actions: number }[]
}

export const TotalActionsPerAppChart: React.FC<Props> = ({ data }) => {
  // Sort the data by actions in descending order
  const sortedData = [...data].sort((a, b) => b.actions - a.actions)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
        <XAxis
          dataKey="name"
          interval={0} // Ensures every label is displayed
          // @ts-ignore
          tick={{ fontSize: 12, angle: -45, textAnchor: "end" }} // Rotates labels to prevent truncation
        />
        <Tooltip />
        <Bar dataKey="actions" name="Total Actions" fill="#8884d8">
          <LabelList dataKey="actions" position="top" />
          {sortedData.map(data => (
            <Cell key={`total-actions-cell-${data.appId}`} fill="#8884d8" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
