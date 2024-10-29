import React, { useMemo } from "react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Props {
  data: { name: string; appId: string; actions: number }[]
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28FD0",
  "#FF6666",
  "#D4A5A5",
  "#B0E57C",
  "#FFD700",
  "#FF6347",
]

export const ActionsSharePieChart: React.FC<Props> = ({ data }) => {
  const totalActions = data.reduce((sum, item) => sum + item.actions, 0)

  const pieData = useMemo(() => {
    return data
      .map(item => {
        const value = ((item.actions / totalActions) * 100).toFixed(2)

        if (Number(value) > 0) {
          return {
            name: item.name,
            value: Number(value),
          }
        }
        return null
      })
      .filter(Boolean)
  }, [data, totalActions])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={pieData} dataKey="value" nameKey="name" label>
          {pieData.map((name, index) => (
            <Cell key={`cell-${name}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => `${value}%`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
