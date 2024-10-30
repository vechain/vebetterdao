import React from "react"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"

interface Props {
  data: { name: string; appId: string; users: number }[]
}

export const ActiveUsersPerAppChart: React.FC<Props> = ({ data }) => {
  // Sort the data by number of users in descending order
  const sortedData = [...data].sort((a, b) => b.users - a.users)

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
        <Bar dataKey="users" name="Active Users" fill="#82ca9d">
          <LabelList dataKey="users" position="top" />
          {sortedData.map((_, index) => (
            <Cell key={`cell-${index}`} fill="#82ca9d" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
