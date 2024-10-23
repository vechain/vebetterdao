import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Props {
  data: { name: string; appId: string; actions: number }[]
}

export const TotalActionsPerAppChart: React.FC<Props> = ({ data }) => (
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={data}>
      <XAxis dataKey="name" label={{ value: "App Name", position: "insideBottom", dy: 10 }} />
      <YAxis label={{ value: "Total Actions", angle: -90, position: "insideLeft", dx: -10 }} />
      <Tooltip />
      <Legend />
      <Bar dataKey="actions" name="Total Actions" fill="#8884d8" />
    </BarChart>
  </ResponsiveContainer>
)
